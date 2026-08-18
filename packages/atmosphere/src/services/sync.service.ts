import { Injectable } from '@nestjs/common';
import { AppEvents } from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';
import { AtError } from '~/helpers/catchError';
import { PagedResponseImpl } from '~/helpers/PagedResponse';
import { Base, SyncSource } from '~/models';

@Injectable()
export class SyncService {
  constructor(private readonly appHooksService: AppHooksService) {}

  async syncSourceList(
    context: AtContext,
    param: { baseId: string; sourceId?: string },
  ) {
    return new PagedResponseImpl(
      await SyncSource.list(context, param.baseId, param.sourceId),
    );
  }

  async syncCreate(
    context: AtContext,
    param: {
      baseId: string;
      sourceId?: string;
      userId: string;
      syncPayload: Partial<SyncSource>;
      req: AtRequest;
    },
  ) {
    const base = await Base.getWithInfo(context, param.baseId);

    const sync = await SyncSource.insert(context, {
      ...param.syncPayload,
      fk_user_id: param.userId,
      source_id: param.sourceId ? param.sourceId : base.sources[0].id,
      base_id: param.baseId,
    });

    this.appHooksService.emit(AppEvents.SYATMOSPHERE_SOURCE_CREATE, {
      syncSource: sync,
      req: param.req,
      context,
    });

    return sync;
  }

  async syncDelete(
    context: AtContext,
    param: { syncId: string; req: AtRequest },
  ) {
    const syncSource = await SyncSource.get(context, param.syncId);

    if (!syncSource) {
      AtError.get(context).badRequest('Sync source not found');
    }

    const res = await SyncSource.delete(context, param.syncId);

    this.appHooksService.emit(AppEvents.SYATMOSPHERE_SOURCE_DELETE, {
      syncSource,
      req: param.req,
      context,
    });
    return res;
  }

  async syncUpdate(
    context: AtContext,
    param: {
      syncId: string;
      syncPayload: Partial<SyncSource>;
      req: AtRequest;
    },
  ) {
    const syncSource = await SyncSource.get(context, param.syncId);

    if (!syncSource) {
      AtError.get(context).badRequest('Sync source not found');
    }

    const res = await SyncSource.update(
      context,
      param.syncId,
      param.syncPayload,
    );

    this.appHooksService.emit(AppEvents.SYATMOSPHERE_SOURCE_UPDATE, {
      syncSource,
      req: param.req,
      context,
    });

    return res;
  }
}
