import { Injectable } from '@nestjs/common';
import {
  AppEvents,
  EventType,
  IntegrationsType,
  validateAndExtractSSLProp,
} from 'atmosphere-sdk';
import type { BaseReqType, IntegrationType } from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';
import { populateMeta, validatePayload } from '~/helpers';
import { syncBaseMigration } from '~/helpers/syncMigration';
import { Base, Integration, Source } from '~/models';
import { AtError } from '~/helpers/catchError';
import { validateAndNormalizeSqliteConfig } from '~/helpers/validateSqliteFilename';
import Atmosphere from '~/Atmosphere';
import AtmosphereSocket from '~/socket/AtmosphereSocket';

@Injectable()
export class SourcesService {
  constructor(protected readonly appHooksService: AppHooksService) {}

  async baseGetWithConfig(context: AtContext, param: { sourceId: any }) {
    const source = await Source.get(context, param.sourceId);

    if (!source) {
      AtError.get(context).sourceNotFound(param.sourceId);
    }

    source.config = await source.getSourceConfig();

    return source;
  }

  async baseUpdate(
    context: AtContext,
    param: {
      sourceId: string;
      source: BaseReqType;
      baseId: string;
      req: AtRequest;
    },
  ) {
    validatePayload('swagger.json#/components/schemas/BaseReq', param.source);

    const oldSource = await Source.get(context, param.sourceId);

    if (!oldSource) {
      AtError.get(context).sourceNotFound(param.sourceId);
    }

    const baseBody = param.source;

    validateAndNormalizeSqliteConfig(
      baseBody?.config,
      baseBody?.type ?? oldSource?.type,
    );

    const source = await Source.update(context, param.sourceId, {
      ...baseBody,
      type: baseBody.config?.client,
      id: param.sourceId,
    });

    source.config = undefined;
    source.integration_config = undefined;

    const integration = await Integration.get(
      context,
      source.fk_integration_id,
    );

    this.appHooksService.emit(AppEvents.SOURCE_UPDATE, {
      source,
      oldSource,
      req: param.req,
      integration,
      context,
    });

    AtmosphereSocket.broadcastEvent(
      context,
      {
        event: EventType.META_EVENT,
        payload: {
          action: 'source_update',
          payload: source,
        },
      },
      context.socket_id,
    );

    return source;
  }

  async baseList(context: AtContext, param: { baseId: string }) {
    const sources = await Source.list(context, { baseId: param.baseId });

    return sources;
  }

  async baseDelete(
    context: AtContext,
    param: { sourceId: string; req: any },
    ncMeta = Atmosphere.ncMeta,
  ) {
    try {
      const source = await Source.get(context, param.sourceId, true, ncMeta);
      const integration = await Integration.get(
        context,
        source.fk_integration_id,
      );
      await source.delete(context, ncMeta);
      this.appHooksService.emit(AppEvents.SOURCE_DELETE, {
        source: {
          ...source,
          config: undefined,
        },
        req: param.req,
        integration: {
          ...integration,
          config: undefined,
        },
        context,
      });
    } catch (e) {
      AtError.get(context).badRequest(e);
    }
    return true;
  }

  async baseSoftDelete(
    context: AtContext,
    param: { sourceId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    try {
      const source = await Source.get(context, param.sourceId, false, ncMeta);
      await source.softDelete(context, ncMeta);

      source.config = undefined;
      source.integration_config = undefined;

      AtmosphereSocket.broadcastEvent(
        context,
        {
          event: EventType.META_EVENT,
          payload: {
            action: 'source_delete',
            payload: source,
          },
        },
        context.socket_id,
      );
    } catch (e) {
      AtError.get(context).badRequest(e);
    }
    return true;
  }

  async baseCreate(
    context: AtContext,
    param: {
      baseId: string;
      source: BaseReqType;
      logger?: (message: string) => void;
      req: any;
    },
  ): Promise<{
    source: Source;
    error?: any;
  }> {
    validatePayload('swagger.json#/components/schemas/BaseReq', param.source);

    // Unlike baseUpdate, this path never validated the filename — a source could
    // point at Atmosphere's own metadata database (atmosphere.db / atm_data.db).
    validateAndNormalizeSqliteConfig(
      param.source.config,
      (param.source.config as any)?.client ?? param.source.type,
    );

    // type | base | baseId
    const baseBody = param.source;
    baseBody.alias = baseBody.alias?.trim();
    const base = await Base.getWithInfo(context, param.baseId);

    let error;

    param.logger?.('Creating the source');
    let integration: IntegrationType;

    // if missing integration id, create a new private integration
    // and map the id to the source
    if (!(baseBody as any).fk_integration_id) {
      // This branch creates the Integration model directly, bypassing
      // integrationCreate and its guards — mirror the enterprise SQLite block.
      if (baseBody.config?.client === 'sqlite3' && Atmosphere.isEE()) {
        AtError.get(context).badRequest(
          'SQLite connections are only available on the free self-hosted edition',
        );
      }
      integration = await Integration.createIntegration({
        title: baseBody.alias,
        type: IntegrationsType.Database,
        sub_type: baseBody.config?.client,
        is_private: !!param.req.user?.id,
        config: baseBody.config,
        workspaceId: context.workspace_id,
        created_by: param.req.user?.id,
      });

      (baseBody as any).fk_integration_id = integration.id;
      baseBody.config = {
        client: baseBody.config?.client,
      };
      baseBody.type = baseBody.config?.client as unknown as BaseReqType['type'];
    } else {
      integration = await Integration.get(
        context,
        (baseBody as any).fk_integration_id,
      );

      // Check if integration exists
      if (!integration) {
        AtError.get(context).integrationNotFound(
          (baseBody as any).fk_integration_id,
        );
      }

      // check if integration is of type Database
      if (
        integration.type !== IntegrationsType.Database ||
        !integration.sub_type
      ) {
        AtError.badRequest('Integration type should be Database');
      }

      baseBody.type = integration.sub_type as unknown as BaseReqType['type'];
    }

    // update invalid ssl config value if found
    if (baseBody.config?.connection?.ssl) {
      baseBody.config.connection.ssl = validateAndExtractSSLProp(
        baseBody.config.connection,
        baseBody.config.sslUse,
        baseBody.config.client,
      );
    }

    const source = await Source.createBase(context, {
      ...baseBody,
      baseId: base.id,
    });

    try {
      await syncBaseMigration(base, source);

      param.logger?.('Populating meta');

      const info = await populateMeta(context, {
        source,
        base,
        logger: param.logger,
        user: param.req.user,
      });

      this.appHooksService.emit(AppEvents.APIS_CREATED, {
        info,
        req: param.req,
        context,
      });

      source.config = undefined;
      source.integration_config = undefined;

      this.appHooksService.emit(AppEvents.SOURCE_CREATE, {
        source,
        req: param.req,
        integration,
        context,
      });

      AtmosphereSocket.broadcastEvent(
        context,
        {
          event: EventType.META_EVENT,
          payload: {
            action: 'source_create',
            payload: source,
          },
        },
        context.socket_id,
      );
    } catch (e) {
      error = e;
    }

    return { source, error };
  }
}
