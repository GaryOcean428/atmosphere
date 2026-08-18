import { Injectable, Logger } from '@nestjs/common';
import { AppEvents, ClientType } from 'atmosphere-sdk';
import { IntegrationsType } from 'atmosphere-sdk';
import type { IntegrationReqType } from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';
import { validatePayload } from '~/helpers';
import { Base, Integration, IntegrationLink } from '~/models';
import { AtBaseError, AtError } from '~/helpers/catchError';
import { Source } from '~/models';
import { CacheScope, MetaTable, RootScopes } from '~/utils/globals';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import AtConnectionMgrv2 from '~/utils/common/AtConnectionMgrv2';
import { SourcesService } from '~/services/sources.service';
import { generateUniqueName } from '~/helpers/exportImportHelpers';
import { validateAndNormalizeSqliteConfig } from '~/helpers/validateSqliteFilename';
import { isPrivateIntegrationForbidden } from '~/helpers/integrationAccess';

@Injectable()
export class IntegrationsService {
  protected logger = new Logger(IntegrationsService.name);
  constructor(
    protected readonly appHooksService: AppHooksService,
    protected readonly sourcesService: SourcesService,
  ) {}

  async integrationGetWithConfig(
    context: AtContext,
    param: { integrationId: any; includeSources?: boolean },
  ) {
    const integration = await Integration.get(context, param.integrationId);

    if (!integration) {
      AtError.get(context).integrationNotFound(param.integrationId);
    }

    integration.config = await integration.getConnectionConfig();

    if (param.includeSources) {
      await integration.getSources();
    }

    return integration;
  }

  async integrationUpdate(
    context: AtContext,
    param: {
      integrationId: string;
      integration: IntegrationReqType;
      req: AtRequest;
    },
  ) {
    validatePayload(
      'swagger.json#/components/schemas/IntegrationReq',
      param.integration,
    );
    const oldIntegration = await Integration.get(context, param.integrationId);

    const integrationBody = param.integration;
    integrationBody.title = integrationBody.title?.trim();

    validateAndNormalizeSqliteConfig(
      integrationBody?.config,
      integrationBody?.sub_type ?? oldIntegration?.sub_type,
    );

    const integration = await Integration.updateIntegration(
      context,
      param.integrationId,
      {
        ...integrationBody,
        id: param.integrationId,
      },
    );

    // update the cache for the sources which are using this integration
    await this.updateIntegrationSourceConfig({ integration });

    integration.config = undefined;

    this.appHooksService.emit(AppEvents.INTEGRATION_UPDATE, {
      integration,
      req: param.req,
      user: param.req?.user,
      oldIntegration,
      context: {
        ...context,
        base_id: null,
      },
    });

    return integration;
  }

  async integrationList(param: {
    req: AtRequest;
    includeDatabaseInfo: boolean;
    type?: IntegrationsType;
    limit?: number;
    offset?: number;
    query?: string;
  }) {
    const integrations = await Integration.list({
      userId: param.req.user?.id,
      includeDatabaseInfo: param.includeDatabaseInfo,
      type: param.type,
      includeSourceCount: true,
      query: param.query,
    });

    return integrations;
  }

  async integrationDelete(
    context: Omit<AtContext, 'base_id'>,
    param: { integrationId: string; req: any; force: boolean },
  ) {
    const ncMeta = await Atmosphere.ncMeta.startTransaction();
    try {
      const integration = await Integration.get(
        context,
        param.integrationId,
        true,
        ncMeta,
      );

      if (!integration) {
        AtError.get(context).integrationNotFound(param.integrationId);
      }

      // get linked sources
      const sourceListQb = ncMeta
        .knex(MetaTable.SOURCES)
        .where({
          fk_integration_id: integration.id,
        })
        .where((qb) => {
          qb.where('deleted', false).orWhere('deleted', null);
        });

      if (integration.fk_workspace_id) {
        sourceListQb.where('fk_workspace_id', integration.fk_workspace_id);
      }

      const sources: Pick<Source, 'id' | 'base_id'>[] =
        await sourceListQb.select('id', 'base_id');

      if (sources.length > 0 && !param.force) {
        const bases = await Promise.all(
          sources.map(async (source) => {
            return await Base.get(
              {
                workspace_id: integration.fk_workspace_id,
                base_id: source.base_id,
              },
              source.base_id,
              ncMeta,
            );
          }),
        );

        AtError.get(context).integrationLinkedWithMultiple(bases, sources);
      }

      // Delete integration links
      await IntegrationLink.deleteByIntegration(
        { ...context, base_id: null },
        param.integrationId,
        ncMeta,
      );

      await integration.delete(ncMeta);
      this.appHooksService.emit(AppEvents.INTEGRATION_DELETE, {
        integration,
        req: param.req,
        user: param.req?.user,
        context: {
          ...context,
          base_id: null,
        },
      });

      await ncMeta.commit();
    } catch (e) {
      await ncMeta.rollback(e);
      if (e instanceof AtError || e instanceof AtBaseError) throw e;
      this.logger.error('Error deleting integeration', e);
      AtError.get(context).internalServerError('Error deleting integeration');
    }

    return true;
  }

  async integrationSoftDelete(
    context: Omit<AtContext, 'base_id'>,
    param: { integrationId: string; req: any },
  ) {
    try {
      const integration = await Integration.get(context, param.integrationId);
      if (!integration) {
        AtError.get(context).integrationNotFound(param.integrationId);
      }

      const ncMeta = await Atmosphere.ncMeta.startTransaction();
      try {
        // get linked sources
        const sourceListQb = ncMeta
          .knex(MetaTable.SOURCES)
          .where({
            fk_integration_id: integration.id,
          })
          .where((qb) => {
            qb.where('deleted', false).orWhere('deleted', null);
          });

        if (integration.fk_workspace_id) {
          sourceListQb.where('fk_workspace_id', integration.fk_workspace_id);
        }

        const sources: Pick<Source, 'id' | 'base_id'>[] =
          await sourceListQb.select('id', 'base_id');

        for (const source of sources) {
          await this.sourcesService.baseSoftDelete(
            {
              workspace_id: integration.fk_workspace_id,
              base_id: source.base_id,
            },
            {
              sourceId: source.id,
            },
            ncMeta,
          );
        }

        // Delete integration links
        await IntegrationLink.deleteByIntegration(
          { ...context, base_id: null },
          param.integrationId,
          ncMeta,
        );

        await integration.softDelete(ncMeta);
        this.appHooksService.emit(AppEvents.INTEGRATION_DELETE, {
          integration,
          req: param.req,
          user: param.req?.user,
        });

        await ncMeta.commit();
      } catch (e) {
        await ncMeta.rollback(e);
        if (e instanceof AtError || e instanceof AtBaseError) throw e;
        this.logger.error('Error  deleting integeration', e);
        AtError.get(context).internalServerError('Error deleting integeration');
      }
    } catch (e) {
      if (e instanceof AtError || e instanceof AtBaseError) throw e;
      this.logger.error('Error  deleting integeration', e);
      AtError.get(context).internalServerError('Error deleting integeration');
    }

    return true;
  }

  async integrationCreate(
    context: AtContext,
    param: {
      workspaceId?: string;
      integration: IntegrationReqType;
      logger?: (message: string) => void;
      req: any;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    validatePayload(
      'swagger.json#/components/schemas/IntegrationReq',
      param.integration,
    );

    let integrationBody;

    if (param.integration.copy_from_id) {
      integrationBody = await Integration.get(
        context,
        param.integration.copy_from_id,
        false,
        ncMeta,
      );

      if (!integrationBody?.id) {
        AtError.get(context).integrationNotFound(
          param.integration.copy_from_id,
        );
      }

      // A private integration's decrypted config may only be cloned by its
      // owner.
      if (
        isPrivateIntegrationForbidden(
          integrationBody.is_private,
          integrationBody.created_by,
          param.req.user?.id,
        )
      ) {
        AtError.get(context).integrationNotFound(
          param.integration.copy_from_id,
        );
      }

      integrationBody.config = await integrationBody.getConnectionConfig();
    } else {
      integrationBody = param.integration;
    }
    param.logger?.('Creating the integration');
    integrationBody.title = integrationBody.title?.trim();
    // SQLite connections are only offered on the free self-hosted edition
    // (CE + unlicensed On-Prem). Block on licensed On-Prem and Cloud, where
    // Atmosphere.isEE() is true — mirrors the frontend isEEFeatureBlocked gating.
    if (integrationBody.sub_type === 'sqlite3' && Atmosphere.isEE()) {
      AtError.get(context).badRequest(
        'SQLite connections are only available on the free self-hosted edition',
      );
    }
    validateAndNormalizeSqliteConfig(
      integrationBody.config,
      integrationBody.sub_type,
    );
    // for SQLite check for existing integration which refers to the same file
    if (integrationBody.sub_type === 'sqlite3') {
      // get all integrations of type sqlite3
      const integrations = await Integration.list(
        {
          userId: param.req.user?.id,
          includeDatabaseInfo: true,
          type: IntegrationsType.Database,
          sub_type: ClientType.SQLITE,
          includeSourceCount: false,
          query: '',
        },
        ncMeta,
      );

      if (integrations.list && integrations.list.length > 0) {
        for (const integration of integrations.list) {
          const config = integration.config as any;
          if (
            (config?.connection?.filename ||
              config?.connection?.connection?.filename) ===
            (integrationBody.config?.connection?.filename ||
              integrationBody.config?.connection?.connection?.filename)
          ) {
            AtError.get(context).badRequest(
              'Integration with same file already exists',
            );
          }
        }
      }
    }

    let uniqueTitle = '';

    if (param.integration.copy_from_id) {
      const integrations =
        (
          await Integration.list(
            {
              userId: param.req.user?.id,
              includeSourceCount: false,
              query: '',
            },
            ncMeta,
          )
        ).list || [];

      uniqueTitle = generateUniqueName(
        `${integrationBody.title} copy`,
        integrations.map((p) => p.title),
      );
    }

    const integration = await Integration.createIntegration(
      {
        ...integrationBody,
        ...(param.integration.copy_from_id ? { title: uniqueTitle } : {}),
        workspaceId: context.workspace_id,
        created_by: param.req.user.id,
      },
      ncMeta,
    );

    integration.config = undefined;

    this.appHooksService.emit(AppEvents.INTEGRATION_CREATE, {
      integration,
      req: param.req,
      user: param.req?.user,
      context: {
        ...context,
        base_id: null,
      },
    });

    return integration;
  }

  async integrationStore(
    context: AtContext,
    integration: Integration,
    payload?:
      | {
          op: 'list';
          limit: number;
          offset: number;
        }
      | {
          op: 'get';
        }
      | {
          op: 'sum';
          fields: string[];
        },
  ) {
    if (payload.op === 'list') {
      return await integration.storeList(
        context,
        payload.limit,
        payload.offset,
      );
    } else if (payload.op === 'sum') {
      return await integration.storeSum(context, payload.fields);
    } else if (payload.op === 'get') {
      return await integration.storeGetLatest(context);
    }
  }

  // function to update all the integration source config which are using this integration
  // we are overwriting the source config with the new integration config excluding database name and schema name
  protected async updateIntegrationSourceConfig(
    {
      integration,
    }: {
      integration: Integration;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    // get all the bases which are using this integration
    const sources = await ncMeta.metaList2(
      integration.fk_workspace_id,
      RootScopes.WORKSPACE,
      MetaTable.SOURCES,
      {
        condition: {
          fk_integration_id: integration.id,
        },
        xcCondition: {
          _or: [
            {
              deleted: {
                eq: false,
              },
            },
            {
              deleted: {
                eq: null,
              },
            },
          ],
        },
      },
    );

    // iterate and update the cache for the sources
    for (const sourceObj of sources) {
      const source = new Source(sourceObj);

      // update the cache with the new config(encrypted)
      await AtmosphereCache.update(
        {
          workspace_id: source.fk_workspace_id,
          base_id: source.base_id,
        },
        `${CacheScope.SOURCE}:${source.id}`,
        {
          integration_config: integration.config,
        },
      );

      // Destroy local connection + bump Redis version for cross-server invalidation
      await AtConnectionMgrv2.resetSource(source);
    }
  }

  public async callIntegrationEndpoint(
    context: AtContext,
    params: {
      integrationId: string;
      endpoint: string;
      payload?: any;
    },
  ) {
    const integration = await Integration.get(context, params.integrationId);

    const integrationMeta = integration.getIntegrationMeta();

    const wrapper = integration.getIntegrationWrapper();

    if (!integrationMeta || !wrapper) {
      AtError.get(context).badRequest('Invalid integration');
    }

    if (
      !integrationMeta.expose?.includes(params.endpoint) ||
      !(params.endpoint in wrapper) ||
      typeof wrapper[params.endpoint] !== 'function'
    ) {
      AtError.get(context).genericNotFound('Endpoint', params.endpoint);
    }

    return wrapper[params.endpoint](params.payload);
  }
}
