import { Injectable, Logger } from '@nestjs/common';
import { EventType, MetaEventType, UITypes } from 'atmosphere-sdk';
import type { AtContext } from 'atmosphere-sdk';
import type {
  AffectedDependencyResult,
  MetaDependencyEventRequest,
  MetaEventHandler,
} from '~/services/meta-dependency/types';
import { View } from '~/models';
import { MetaTable } from '~/utils/globals';
import AtmosphereSocket from '~/socket/AtmosphereSocket';
import Atmosphere from '~/Atmosphere';

/**
 * When an Attachment column changes type to anything else, any view that
 * pinned it as the expanded-form mode column has a dangling
 * `attachment_mode_column_id`. Reset that FK so the expanded form falls back
 * to field mode.
 */
@Injectable()
export class ColumnUpdateExpandedModeDependencyHandler
  implements MetaEventHandler
{
  private readonly logger = new Logger(
    ColumnUpdateExpandedModeDependencyHandler.name,
  );

  triggerMetaEvents: MetaEventType[] = [MetaEventType.COLUMN_UPDATED];

  async getAffectedDependency(
    _context: AtContext,
    param: MetaDependencyEventRequest,
    _ncMeta = Atmosphere.ncMeta,
  ): Promise<AffectedDependencyResult | undefined> {
    const oldCol = param.oldEntity;
    const newCol = param.newEntity;
    if (!oldCol?.id || !newCol?.id) return undefined;

    if (oldCol.uidt !== UITypes.Attachment) return undefined;
    if (newCol.uidt === UITypes.Attachment) return undefined;

    return {};
  }

  async handle(
    context: AtContext,
    param: MetaDependencyEventRequest & {
      affectedDependencyResult: AffectedDependencyResult;
    },
    ncMeta = Atmosphere.ncMeta,
  ): Promise<void> {
    const oldCol = param.oldEntity;
    if (!oldCol?.id || !oldCol.fk_model_id) return;

    const affectedViewIds = new Set<string>(
      (
        await ncMeta.metaList2(
          context.workspace_id,
          context.base_id,
          MetaTable.VIEWS,
          { condition: { attachment_mode_column_id: oldCol.id } },
        )
      ).map((v: any) => v.id),
    );

    await View.updateIfColumnUsedAsExpandedMode(
      context,
      oldCol.id,
      oldCol.fk_model_id,
      ncMeta,
    );

    this.broadcastViewUpdates(context, affectedViewIds).catch((e) =>
      this.logger.error(
        `Failed to broadcast view_update events: ${e?.message}`,
        e?.stack,
      ),
    );
  }

  private async broadcastViewUpdates(
    context: AtContext,
    viewIds: Set<string>,
  ): Promise<void> {
    for (const viewId of viewIds) {
      const view = await View.get(context, viewId, false, Atmosphere.ncMeta);
      if (!view) continue;
      await view.getView(context, Atmosphere.ncMeta);
      AtmosphereSocket.broadcastEvent(context, {
        event: EventType.META_EVENT,
        payload: { action: 'view_update', payload: view },
      });
    }
  }
}
