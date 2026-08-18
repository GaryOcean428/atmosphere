import type { AtContext } from '~/interface/config';
import User from '~/models/User';
import { AtError } from '~/helpers/catchError';
import Atmosphere from '~/Atmosphere';
import { extractProps } from '~/helpers/extractProps';
import { MetaTable } from '~/utils/globals';
import { isReplay } from '~/helpers/replayScope';

export default class SyncSource {
  id?: string;
  title?: string;
  type?: string;
  details?: any;
  deleted?: boolean;
  order?: number;
  fk_workspace_id?: string;
  base_id?: string;
  source_id?: string;
  fk_user_id?: string;

  constructor(syncSource: Partial<SyncSource>) {
    Object.assign(this, syncSource);
  }

  public getUser(ncMeta = Atmosphere.ncMeta) {
    return User.get(this.fk_user_id, ncMeta);
  }

  public static async get(
    context: AtContext,
    syncSourceId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const syncSource = await ncMeta.metaGet2(
      context.workspace_id,
      context.base_id,
      MetaTable.SYATMOSPHERE_SOURCE,
      syncSourceId,
    );
    if (!syncSource) return null;
    if (syncSource.details && typeof syncSource.details === 'string') {
      try {
        syncSource.details = JSON.parse(syncSource.details);
      } catch {}
    }
    return new SyncSource(syncSource);
  }

  static async list(
    context: AtContext,
    baseId: string,
    sourceId?: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const condition = sourceId
      ? { base_id: baseId, source_id: sourceId }
      : { base_id: baseId };
    const syncSources = await ncMeta.metaList2(
      context.workspace_id,
      context.base_id,
      MetaTable.SYATMOSPHERE_SOURCE,
      {
        condition,
        orderBy: {
          created_at: 'asc',
        },
      },
    );

    for (const syncSource of syncSources) {
      if (syncSource.details && typeof syncSource.details === 'string') {
        try {
          syncSource.details = JSON.parse(syncSource.details);
        } catch {}
      }
    }
    return syncSources?.map((h) => new SyncSource(h));
  }

  public static async insert(
    context: AtContext,
    syncSource: Partial<SyncSource>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(syncSource, [
      'title',
      'type',
      'details',
      'base_id',
      'source_id',
      'fk_user_id',
    ]);

    // Replay-only: preserve sandbox / undo-redo entity ID for idempotent merge.
    if (isReplay() && syncSource.id) {
      insertObj.id = syncSource.id;
    }

    if (insertObj.details && typeof insertObj.details === 'object') {
      insertObj.details = JSON.stringify(insertObj.details);
    }

    const { id } = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.SYATMOSPHERE_SOURCE,
      insertObj,
    );

    return this.get(context, id, ncMeta);
  }

  public static async update(
    context: AtContext,
    syncSourceId: string,
    syncSource: Partial<SyncSource>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(syncSource, [
      'id',
      'title',
      'type',
      'details',
      'deleted',
      'order',
      'base_id',
      'source_id',
    ]);

    if (updateObj.details && typeof updateObj.details === 'object') {
      updateObj.details = JSON.stringify(updateObj.details);
    }

    // set meta
    await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.SYATMOSPHERE_SOURCE,
      updateObj,
      syncSourceId,
    );

    return this.get(context, syncSourceId, ncMeta);
  }

  static async delete(
    context: AtContext,
    syncSourceId: any,
    ncMeta = Atmosphere.ncMeta,
  ) {
    return await ncMeta.metaDelete(
      context.workspace_id,
      context.base_id,
      MetaTable.SYATMOSPHERE_SOURCE,
      syncSourceId,
    );
  }

  static async deleteByUserId(userId: string, ncMeta = Atmosphere.ncMeta) {
    if (!userId) AtError.badRequest('User Id is required');

    return await ncMeta
      .knex(MetaTable.SYATMOSPHERE_SOURCE)
      .where({
        fk_user_id: userId,
      })
      .del();
  }
}
