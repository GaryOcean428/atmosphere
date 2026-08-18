import { Injectable } from '@nestjs/common';
import type { AtApiVersion, AtRequest } from 'atmosphere-sdk';
import type { PathParams } from '~/helpers/dataHelpers';
import type { BaseModelSqlv2 } from '~/db/BaseModelSqlv2';
import { AtContext } from '~/interface/config';
import {
  getViewAndModelByAliasOrId,
  validateV1V2DataPayloadLimit,
} from '~/helpers/dataHelpers';
import AtConnectionMgrv2 from '~/utils/common/AtConnectionMgrv2';
import { Model, Source } from '~/models';
import { TraceCommand } from '~/decorators/trace-command.decorator';
import { OperationName } from '~/command-registry/op-names';

type BulkOperation =
  | 'bulkInsert'
  | 'bulkUpdate'
  | 'bulkUpdateAll'
  | 'bulkDelete'
  | 'bulkUpsert'
  | 'bulkDeleteAll';

@Injectable()
export class BulkDataAliasService {
  async getModelViewBase(context: AtContext, param: PathParams) {
    const { model, view } = await getViewAndModelByAliasOrId(context, param);

    const source = await Source.get(context, model.source_id);
    return { model, view, source };
  }

  async executeBulkOperation<T extends BulkOperation>(
    context: AtContext,
    param: PathParams & {
      operation: T;
      options: Parameters<(typeof BaseModelSqlv2.prototype)[T]>;
    },
  ) {
    const { model, view, source } = await this.getModelViewBase(context, param);
    const baseModel = await Model.getBaseModelSQL(context, {
      id: model.id,
      viewId: view?.id,
      dbDriver: await AtConnectionMgrv2.get(source),
    });
    return await baseModel[param.operation].apply(null, param.options);
  }

  // todo: Integrate with filterArrJson bulkDataUpdateAll
  @TraceCommand(OperationName.recordBulkInsert)
  async bulkDataInsert(
    context: AtContext,
    param: PathParams & {
      body: any;
      cookie: AtRequest;
      chunkSize?: number;
      foreign_key_checks?: boolean;
      skip_hooks?: boolean;
      raw?: boolean;
      allowSystemColumn?: boolean;
      undo?: boolean;
      skipPermissionCheck?: boolean;
      skipAttachmentOwnershipCheck?: boolean;
      onInsertedPks?: (pks: (string | number)[]) => void;
    },
  ) {
    validateV1V2DataPayloadLimit(context, param);

    return await this.executeBulkOperation(context, {
      ...param,
      operation: 'bulkInsert',
      options: [
        param.body,
        {
          cookie: param.cookie,
          foreign_key_checks: param.foreign_key_checks,
          skip_hooks: param.skip_hooks,
          raw: param.raw,
          allowSystemColumn: param.allowSystemColumn,
          undo: param.undo,
          skipPermissionCheck: param.skipPermissionCheck,
          skipAttachmentOwnershipCheck: param.skipAttachmentOwnershipCheck,
          onInsertedPks: param.onInsertedPks,
        },
      ],
    });
  }

  // todo: Integrate with filterArrJson bulkDataUpdateAll
  @TraceCommand(OperationName.recordBulkUpdate)
  async bulkDataUpdate(
    context: AtContext,
    param: PathParams & {
      body: any;
      cookie: AtRequest;
      raw?: boolean;
      allowSystemColumn?: boolean;
      apiVersion?: AtApiVersion;
    },
  ) {
    validateV1V2DataPayloadLimit(context, param);

    return await this.executeBulkOperation(context, {
      ...param,
      operation: 'bulkUpdate',
      options: [
        param.body,
        {
          cookie: param.cookie,
          raw: param.raw,
          allowSystemColumn: param.allowSystemColumn,
          apiVersion: param.apiVersion,
          typecast: (param.cookie?.query?.typecast ?? '') === 'true',
        },
      ],
    });
  }

  // todo: Integrate with filterArrJson bulkDataUpdateAll
  async bulkDataUpdateAll(
    context: AtContext,
    param: PathParams & {
      body: any;
      cookie: AtRequest;
      query: any;
      internalFlags?: {
        skipHooks?: boolean;
        allowSystemColumn?: boolean;
      };
    },
  ) {
    return await this.executeBulkOperation(context, {
      ...param,
      operation: 'bulkUpdateAll',
      options: [
        param.query,
        param.body,
        {
          cookie: param.cookie,
          skip_hooks: param.internalFlags?.skipHooks,
          allowSystemColumn: param.internalFlags?.allowSystemColumn,
        },
      ],
    });
  }

  @TraceCommand(OperationName.recordBulkDelete)
  async bulkDataDelete(
    context: AtContext,
    param: PathParams & {
      body: any;
      cookie: AtRequest;
      internalFlags?: {
        allowSystemColumn?: boolean;
      };
    },
  ) {
    validateV1V2DataPayloadLimit(context, param);

    return await this.executeBulkOperation(context, {
      ...param,
      operation: 'bulkDelete',
      options: [
        param.body,
        {
          cookie: param.cookie,
          allowSystemColumn: param.internalFlags?.allowSystemColumn,
        },
      ],
    });
  }

  // todo: Integrate with filterArrJson bulkDataDeleteAll
  async bulkDataDeleteAll(
    context: AtContext,
    param: PathParams & {
      query: any;
      req: AtRequest;
      internalFlags?: {
        skipHooks?: boolean;
      };
    },
  ) {
    return await this.executeBulkOperation(context, {
      ...param,
      operation: 'bulkDeleteAll',
      options: [
        param.query,
        { cookie: param.req, skip_hooks: param.internalFlags?.skipHooks },
      ],
    });
  }

  @TraceCommand(OperationName.recordBulkUpsert)
  async bulkDataUpsert(
    context: AtContext,
    param: PathParams & {
      body: any;
      cookie: AtRequest;
      undo: boolean;
    },
  ) {
    validateV1V2DataPayloadLimit(context, param);

    return await this.executeBulkOperation(context, {
      ...param,
      operation: 'bulkUpsert',
      options: [
        param.body,
        {
          cookie: param.cookie,
          undo: param.undo,
          typecast: (param.cookie?.query?.typecast ?? '') === 'true',
        },
      ],
    });
  }
}
