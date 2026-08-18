import process from 'process';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { compareVersions, validate } from 'compare-versions';
import { getCircularReplacer, OperationSource, ViewTypes } from 'atmosphere-sdk';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import type { ErrorReportReqType } from 'atmosphere-sdk';
import type { AppConfig, AtRequest } from '~/interface/config';
import { getFilteredAgents } from '~/utils/ssrf';
import {
  ATMOSPHERE_ATTACHMENT_FIELD_SIZE,
  ATMOSPHERE_DATA_IMPORT_FILE_SIZE,
  ATMOSPHERE_GRID_MAX_SELECTION_LIMIT,
  ATMOSPHERE_MAX_ATTACHMENTS_ALLOWED,
  ATMOSPHERE_MAX_TEXT_LENGTH,
} from '~/constants';
import SqlMgrv2 from '~/db/sql-mgr/v2/SqlMgrv2';
import { AtError } from '~/helpers/catchError';
import { Base, User } from '~/models';
import Atmosphere from '~/Atmosphere';
import { isCloud, isEE, isOnPrem, T } from '~/utils';
import AtConnectionMgrv2 from '~/utils/common/AtConnectionMgrv2';
import getInstance from '~/utils/getInstance';
import { CacheScope, MetaTable, RootScopes } from '~/utils/globals';
import { jdbcToXcConfig } from '~/utils/atm-config/helpers';
import { ATMOSPHERE_DISABLE_UNDO_REDO } from '~/utils/atm-config/constants';
import { packageVersion } from '~/utils/packageVersion';
import {
  defaultGroupByLimitConfig,
  defaultLimitConfig,
} from '~/helpers/extractLimitAndOffset';
import {
  DriverClient,
  ATMOSPHERE_DISABLE_GROUP_BY_AGG,
  ATMOSPHERE_DISABLE_SUPPORT_CHAT,
} from '~/utils/atm-config';
import AtmosphereCache from '~/cache/AtmosphereCache';

const versionCache = {
  releaseVersion: null,
  lastFetched: null,
};

const defaultConnectionConfig: any = {
  // https://github.com/knex/knex/issues/97
  // timezone: process.env.ATMOSPHERE_TIMEZONE || 'UTC',
  dateStrings: true,
};

interface ViewCount {
  formCount: number | null;
  gridCount: number | null;
  galleryCount: number | null;
  kanbanCount: number | null;
  total: number | null;
  sharedFormCount: number | null;
  sharedGridCount: number | null;
  sharedGalleryCount: number | null;
  sharedKanbanCount: number | null;
  sharedTotal: number | null;
  sharedLockedCount: number | null;
}

interface AllMeta {
  baseCount: number;
  bases: (
    | {
        external?: boolean | null;
        tableCount: {
          table: number;
          view: number;
        } | null;
        viewCount: ViewCount;
        webhookCount: number | null;
        filterCount: number | null;
        sortCount: number | null;
        rowCount: ({ totalRecords: number } | null)[] | null;
        userCount: number | null;
      }
    | { error: string }
  )[];
  userCount: number;
  sharedBaseCount: number;
}

@Injectable()
export class UtilsService {
  protected logger = new Logger(UtilsService.name);

  constructor(protected readonly configService: ConfigService<AppConfig>) {}

  lastSyncTime = null;

  async versionInfo() {
    if (
      !versionCache.lastFetched ||
      (versionCache.lastFetched &&
        versionCache.lastFetched < Date.now() - 1000 * 60 * 60)
    ) {
      const nonBetaTags = await axios
        .get('https://api.github.com/repos/atmosphere/atmosphere/tags', {
          timeout: 5000,
        })
        .then((response) => {
          return response.data
            .map((x) => x.name)
            .filter(
              (v) =>
                validate(v) &&
                // also filter only XXX.XXX.XXX version. ex: 0.263.8
                v.match(/^\d+\.\d+\.\d+$/),
            )
            .sort((x, y) => compareVersions(y, x));
        })
        .catch(() => null);
      if (nonBetaTags && nonBetaTags.length > 0) {
        versionCache.releaseVersion = nonBetaTags[0];
      }
      versionCache.lastFetched = Date.now();
    }

    const response = {
      currentVersion: packageVersion,
      releaseVersion: versionCache.releaseVersion,
    };

    return response;
  }

  async appHealth() {
    return {
      message: 'OK',
      timestamp: Date.now(),
      uptime: process.uptime(),
    };
  }

  async _axiosRequestMake(param: {
    body: {
      apiMeta: any;
    };
  }) {
    const { apiMeta } = param.body;

    if (apiMeta?.body) {
      try {
        apiMeta.body = JSON.parse(apiMeta.body);
      } catch (e) {
        console.log(e);
      }
    }

    if (apiMeta?.auth) {
      try {
        apiMeta.auth = JSON.parse(apiMeta.auth);
      } catch (e) {
        console.log(e);
      }
    }

    apiMeta.response = {};
    const _req = {
      params: apiMeta.parameters
        ? apiMeta.parameters.reduce((paramsObj, param) => {
            if (param.name && param.enabled) {
              paramsObj[param.name] = param.value;
            }
            return paramsObj;
          }, {})
        : {},
      url: apiMeta.url,
      method: apiMeta.method || 'GET',
      data: apiMeta.body || {},
      headers: apiMeta.headers
        ? apiMeta.headers.reduce((headersObj, header) => {
            if (header.name && header.enabled) {
              headersObj[header.name] = header.value;
            }
            return headersObj;
          }, {})
        : {},
      responseType: apiMeta.responseType || 'json',
      withCredentials: true,
      ...getFilteredAgents({
        url: apiMeta.url,
        source: OperationSource.DATA_IMPORT,
      }),
    };
    const data = await axios(_req);
    return data?.data;
  }

  async axiosRequestMake(param: {
    body: {
      apiMeta: any;
    };
  }) {
    const {
      apiMeta: { url },
    } = param.body;
    // Test the extension against the URL's pathname only, so callers can't
    // smuggle a non-spreadsheet target by appending `?.csv` to the query
    // string. `useAgent` in _axiosRequestMake handles SSRF at the socket.
    let pathname: string;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return {};
    }
    const isExcelImport = /\.(xls|xlsx|xlsm|ods|ots)$/i;
    const isCSVImport = /\.(csv)$/i;
    if (!isCSVImport.test(pathname) && !isExcelImport.test(pathname)) {
      return {};
    }
    param.body.apiMeta.responseType = 'arraybuffer';
    return await this._axiosRequestMake({
      body: param.body,
    });
  }

  async urlToDbConfig(param: {
    body: {
      url: string;
    };
  }) {
    const { url } = param.body;
    try {
      const connectionConfig = jdbcToXcConfig(url);
      return connectionConfig;
    } catch (error) {
      return AtError.internalServerError(
        'Please check server log for more details',
      );
    }
  }

  async aggregatedMetaInfo() {
    // TODO: fix or deprecate for EE
    const [bases, userCount] = await Promise.all([
      Base.list(),
      Atmosphere.ncMeta.metaCount(RootScopes.ROOT, RootScopes.ROOT, MetaTable.USERS),
    ]);

    const result: AllMeta = {
      baseCount: bases.length,
      bases: [],
      userCount,
      sharedBaseCount: 0,
    };

    result.bases.push(
      ...this.extractResultOrNull(
        await Promise.allSettled(
          bases.map(async (base) => {
            if (base.uuid) result.sharedBaseCount++;
            const [
              tableCount,
              dbViewCount,
              viewCount,
              webhookCount,
              filterCount,
              sortCount,
              rowCount,
              userCount,
            ] = this.extractResultOrNull(
              await Promise.allSettled([
                // db tables  count
                Atmosphere.ncMeta.metaCount(
                  base.fk_workspace_id,
                  base.id,
                  MetaTable.MODELS,
                  {
                    condition: {
                      type: 'table',
                    },
                  },
                ),
                // db views count
                Atmosphere.ncMeta.metaCount(
                  base.fk_workspace_id,
                  base.id,
                  MetaTable.MODELS,
                  {
                    condition: {
                      type: 'view',
                    },
                  },
                ),
                // views count
                (async () => {
                  const views = await Atmosphere.ncMeta.metaList2(
                    base.fk_workspace_id,
                    base.id,
                    MetaTable.VIEWS,
                  );
                  // grid, form, gallery, kanban and shared count
                  return (views as any[]).reduce<ViewCount>(
                    (out, view) => {
                      out.total++;

                      switch (view.type) {
                        case ViewTypes.GRID:
                          out.gridCount++;
                          if (view.uuid) out.sharedGridCount++;
                          break;
                        case ViewTypes.FORM:
                          out.formCount++;
                          if (view.uuid) out.sharedFormCount++;
                          break;
                        case ViewTypes.GALLERY:
                          out.galleryCount++;
                          if (view.uuid) out.sharedGalleryCount++;
                          break;
                        case ViewTypes.KANBAN:
                          out.kanbanCount++;
                          if (view.uuid) out.sharedKanbanCount++;
                      }

                      if (view.uuid) {
                        if (view.password) out.sharedLockedCount++;
                        out.sharedTotal++;
                      }

                      return out;
                    },
                    {
                      formCount: 0,
                      gridCount: 0,
                      galleryCount: 0,
                      kanbanCount: 0,
                      total: 0,
                      sharedFormCount: 0,
                      sharedGridCount: 0,
                      sharedGalleryCount: 0,
                      sharedKanbanCount: 0,
                      sharedTotal: 0,
                      sharedLockedCount: 0,
                    },
                  );
                })(),
                // webhooks count (excluding trashed)
                Atmosphere.ncMeta.metaCount(
                  base.fk_workspace_id,
                  base.id,
                  MetaTable.HOOKS,
                  {
                    xcCondition: {
                      _or: [
                        { deleted: { eq: false } },
                        { deleted: { eq: null } },
                      ],
                    },
                  },
                ),
                // filters count
                Atmosphere.ncMeta.metaCount(
                  base.fk_workspace_id,
                  base.id,
                  MetaTable.FILTER_EXP,
                ),
                // sorts count
                Atmosphere.ncMeta.metaCount(
                  base.fk_workspace_id,
                  base.id,
                  MetaTable.SORT,
                ),
                // row count per base
                base.getSources().then(async (sources) => {
                  return this.extractResultOrNull(
                    await Promise.allSettled(
                      sources.map(async (source) =>
                        (await AtConnectionMgrv2.getSqlClient(source))
                          .totalRecords?.()
                          ?.then((result) => result?.data),
                      ),
                    ),
                  );
                }),
                // base users count
                Atmosphere.ncMeta.metaCount(
                  base.fk_workspace_id,
                  base.id,
                  MetaTable.PROJECT_USERS,
                  {
                    condition: {
                      base_id: base.id,
                    },
                    aggField: '*',
                  },
                ),
              ]),
            );

            return {
              tableCount: { table: tableCount, view: dbViewCount },
              external: !base.is_meta,
              viewCount,
              webhookCount,
              filterCount,
              sortCount,
              rowCount,
              userCount,
            };
          }),
        ),
      ),
    );

    return result;
  }

  extractResultOrNull = (results: PromiseSettledResult<any>[]) => {
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return null;
    });
  };

  async testConnection(param: { body: any }) {
    return await SqlMgrv2.testConnection(param.body);
  }

  async appInfo(param: { req: { ncSiteUrl: string } }) {
    const baseHasAdmin = !(await User.isFirst());
    const instance = await getInstance();

    const settings = await Atmosphere.getAppSettings();

    const oidcAuthEnabled = ['openid', 'oidc'].includes(
      process.env.ATMOSPHERE_SSO?.toLowerCase(),
    );
    const oidcProviderName = oidcAuthEnabled
      ? process.env.ATMOSPHERE_OIDC_PROVIDER_NAME ?? 'OpenID Connect'
      : null;

    let giftUrl: string;

    if (instance.impacted >= 5) {
      giftUrl = `https://w21dqb1x.atmosphere.dev/#/atm/form/4d2e0e4b-df97-4c5e-ad8e-f8b8cca90330?Users=${
        instance.impacted
      }&Bases=${instance.projectsExt + instance.projectsMeta}`;
    }

    const samlAuthEnabled = process.env.ATMOSPHERE_SSO?.toLowerCase() === 'saml';
    const samlProviderName = samlAuthEnabled
      ? process.env.ATMOSPHERE_SSO_SAML_PROVIDER_NAME ?? 'SAML'
      : null;

    const result = {
      authType: 'jwt',
      baseHasAdmin,
      firstUser: !baseHasAdmin,
      type: 'rest',
      env: process.env.NODE_ENV,
      googleAuthEnabled: !!(
        process.env.ATMOSPHERE_GOOGLE_CLIENT_ID && process.env.ATMOSPHERE_GOOGLE_CLIENT_SECRET
      ),
      githubAuthEnabled: !!(
        process.env.ATMOSPHERE_GITHUB_CLIENT_ID && process.env.ATMOSPHERE_GITHUB_CLIENT_SECRET
      ),
      oidcAuthEnabled,
      oidcProviderName,
      oneClick: !!process.env.ATMOSPHERE_ONE_CLICK,
      connectToExternalDB: !process.env.ATMOSPHERE_CONNECT_TO_EXTERNAL_DB_DISABLED,
      version: packageVersion,
      defaultLimit: Math.max(
        Math.min(defaultLimitConfig.limitDefault, defaultLimitConfig.limitMax),
        defaultLimitConfig.limitMin,
      ),
      defaultGroupByLimit: defaultGroupByLimitConfig,
      timezone: defaultConnectionConfig.timezone,
      ncMin: !!process.env.ATMOSPHERE_MIN,
      teleEnabled: process.env.ATMOSPHERE_DISABLE_TELE !== 'true',
      errorReportingEnabled: process.env.ATMOSPHERE_DISABLE_ERR_REPORTS !== 'true',
      sentryDSN:
        process.env.ATMOSPHERE_DISABLE_ERR_REPORTS !== 'true'
          ? process.env.ATMOSPHERE_SENTRY_DSN
          : null,
      auditEnabled: process.env.ATMOSPHERE_DISABLE_AUDIT !== 'true',
      undoRedoEnabled: !ATMOSPHERE_DISABLE_UNDO_REDO,
      ncSiteUrl: (param.req as any).ncSiteUrl,
      ee: Atmosphere.isEE(),
      ncAttachmentFieldSize: ATMOSPHERE_ATTACHMENT_FIELD_SIZE,
      ncMaxAttachmentsAllowed: ATMOSPHERE_MAX_ATTACHMENTS_ALLOWED,
      ncMaxTextLength: ATMOSPHERE_MAX_TEXT_LENGTH,
      ncDataImportFileSize: ATMOSPHERE_DATA_IMPORT_FILE_SIZE,
      ncGridMaxSelectionLimit: ATMOSPHERE_GRID_MAX_SELECTION_LIMIT,
      isCloud: isCloud,
      automationLogLevel: process.env.ATMOSPHERE_AUTOMATION_LOG_LEVEL || 'OFF',
      baseHostName: process.env.ATMOSPHERE_BASE_HOST_NAME,
      disableEmailAuth: this.configService.get('auth.disableEmailAuth', {
        infer: true,
      }),
      feedEnabled: process.env.ATMOSPHERE_DISABLE_PRODUCT_FEED !== 'true',
      mainSubDomain: this.configService.get('mainSubDomain', { infer: true }),
      dashboardPath: this.configService.get('dashboardPath', { infer: true }),
      inviteOnlySignup: settings.invite_only_signup,
      restrictWorkspaceCreation: settings.restrict_workspace_creation,
      allowEmailSigninWithSso: settings.allow_email_signin_with_sso,
      samlProviderName,
      samlAuthEnabled,
      giftUrl,
      prodReady: Atmosphere.getConfig()?.meta?.db?.client !== DriverClient.SQLITE,
      allowLocalUrl:
        process.env.ATMOSPHERE_WEBHOOK_ALLOW_PRIVATE_NETWORK === 'true' ||
        process.env.ATMOSPHERE_ALLOW_LOCAL_HOOKS === 'true',
      isOnPrem,
      disableSupportChat: ATMOSPHERE_DISABLE_SUPPORT_CHAT,
      disableGroupByAggregation: ATMOSPHERE_DISABLE_GROUP_BY_AGG,
      /**
       * Allow disabling onboarding flow based on env variable or development mode
       *
       * TODO: @rameshmane7218 remove test env once we enable onboarding flow in playwright
       */
      disableOnboardingFlow:
        process.env.ATMOSPHERE_DISABLE_ONBOARDING_FLOW === 'true' ||
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test',
      ...(isEE === false
        ? {
            defaultWorkspaceId: Atmosphere.ncDefaultWorkspaceId || null,
          }
        : {}),
    };

    return result;
  }

  async reportErrors(param: { body: ErrorReportReqType; req: AtRequest }) {
    for (const error of param.body?.errors ?? []) {
      T.emit('evt', {
        evt_type: 'gui:error',
        properties: {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 2).join('\n'),
          ...(param.body.extra || {}),
        },
      });
    }
  }

  async feed(req: AtRequest) {
    const {
      type = 'all',
      page = '1',
      per_page = '10',
    } = req.query as {
      type: 'github' | 'youtube' | 'all' | 'twitter' | 'cloud';
      page: string;
      per_page: string;
    };

    const perPage = Math.min(Math.max(parseInt(per_page, 10) || 10, 1), 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const cacheKey = `${CacheScope.PRODUCT_FEED}:${type}:${pageNum}:${perPage}`;

    const cachedData = await AtmosphereCache.get('root', cacheKey, 'json');

    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        this.logger.error(e?.message, e);
        await AtmosphereCache.del('root', cacheKey);
      }
    }

    let payload = null;
    if (
      !this.lastSyncTime ||
      dayjs().isAfter(this.lastSyncTime.add(3, 'hours'))
    ) {
      payload = await T.payload();
      this.lastSyncTime = dayjs();
    }

    let response;

    try {
      response = await axios.post(
        'https://product-feed.atmosphere.dev/api/v1/social/feed',
        payload,
        {
          params: {
            per_page: perPage,
            page: pageNum,
            type,
          },
        },
      );
    } catch (e) {
      this.logger.error(e?.message, e);
      return [];
    }

    // The feed includes the attachments, which has the presigned URL
    // So the cache should match the presigned URL cache
    await AtmosphereCache.setExpiring(
      'root',
      cacheKey,
      JSON.stringify(response.data, getCircularReplacer),
      Number.isNaN(parseInt(process.env.ATMOSPHERE_ATTACHMENT_EXPIRE_SECONDS))
        ? 2 * 60 * 60
        : parseInt(process.env.ATMOSPHERE_ATTACHMENT_EXPIRE_SECONDS),
    );

    return response.data;
  }

  async cloudFeatures(_req: AtRequest) {
    const cacheKey = `${CacheScope.CLOUD_FEATURES}`;

    const cachedData = await AtmosphereCache.get('root', cacheKey, 'json');

    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        this.logger.error(e?.message, e);
        await AtmosphereCache.del('root', cacheKey);
      }
    }

    let payload = null;
    if (
      !this.lastSyncTime ||
      dayjs().isAfter(this.lastSyncTime.add(3, 'hours'))
    ) {
      payload = await T.payload();
      this.lastSyncTime = dayjs();
    }

    let response;

    try {
      response = await axios.post(
        'https://product-feed.atmosphere.dev/api/v1/cloud/features',
        payload,
      );
    } catch (e) {
      this.logger.error(e?.message, e);
      return [];
    }

    await AtmosphereCache.setExpiring(
      'root',
      cacheKey,
      JSON.stringify(response.data, getCircularReplacer),
      3 * 60 * 60,
    );

    return response.data;
  }
}
