import { PlanLimitTypes } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import { prepareForDb, prepareForResponse } from '~/utils/modelUtils';
import Atmosphere from '~/Atmosphere';
import { extractProps } from '~/helpers/extractProps';
import {
  CacheDelDirection,
  CacheGetType,
  CacheScope,
  MetaTable,
} from '~/utils/globals';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { isReplay } from '~/helpers/replayScope';

export default class Extension {
  id?: string;
  fk_workspace_id?: string;
  base_id?: string;
  fk_user_id?: string;
  extension_id?: string;
  title?: string;
  kv_store?: any;
  meta?: any;
  order?: number;

  constructor(extension: Partial<Extension>) {
    Object.assign(this, extension);
  }

  public static async get(
    context: AtContext,
    extensionId: string,
    includeDeleted = false,
    ncMeta = Atmosphere.ncMeta,
  ) {
    let extension = await AtmosphereCache.get(
      context,
      `${CacheScope.EXTENSION}:${extensionId}`,
      CacheGetType.TYPE_OBJECT,
    );

    if (!extension) {
      extension = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.EXTENSIONS,
        extensionId,
      );

      if (extension) {
        extension = prepareForResponse(extension, ['kv_store', 'meta']);
        AtmosphereCache.set(
          context,
          `${CacheScope.EXTENSION}:${extensionId}`,
          extension,
        );
      }
    }

    if (extension?.deleted && !includeDeleted) return null;

    return extension && new Extension(extension);
  }

  static async list(
    context: AtContext,
    baseId: string,
    includeDeleted = false,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(context, CacheScope.EXTENSION, [
      baseId,
    ]);
    let { list: extensionList } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !extensionList.length) {
      extensionList = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.EXTENSIONS,
        {
          condition: {
            base_id: baseId,
          },
          orderBy: {
            created_at: 'asc',
          },
        },
      );

      if (extensionList) {
        extensionList = extensionList.map((extension) =>
          prepareForResponse(extension, ['kv_store', 'meta']),
        );
        await AtmosphereCache.setList(
          context,
          CacheScope.EXTENSION,
          [baseId],
          extensionList,
        );
      }
    }

    if (!includeDeleted) {
      extensionList = extensionList.filter((e) => !e.deleted);
    }

    return extensionList
      ?.sort((a, b) => (a?.order ?? Infinity) - (b?.order ?? Infinity))
      .map((extension) => new Extension(extension));
  }

  public static async insert(
    context: AtContext,
    extension: Partial<Extension>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(extension, [
      'fk_user_id',
      'extension_id',
      'title',
      'kv_store',
      'meta',
      'order',
    ]);

    // Replay-only: preserve sandbox / undo-redo entity ID for idempotent merge.
    if (isReplay() && extension.id) {
      insertObj.id = extension.id;
    }

    if (insertObj.order === null || insertObj.order === undefined) {
      insertObj.order = await ncMeta.metaGetNextOrder(MetaTable.EXTENSIONS, {
        base_id: context.base_id,
      });
    }

    const { id } = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.EXTENSIONS,
      prepareForDb(insertObj, ['kv_store', 'meta']),
    );

    await AtmosphereCache.incrHashField(
      'root',
      `${CacheScope.RESOURCE_STATS}:workspace:${context.workspace_id}`,
      PlanLimitTypes.LIMIT_EXTENSION_PER_WORKSPACE,
      1,
    );

    return this.get(context, id, false, ncMeta).then(async (res) => {
      await AtmosphereCache.appendToList(
        context,
        CacheScope.EXTENSION,
        [context.base_id],
        `${CacheScope.EXTENSION}:${id}`,
      );
      return res;
    });
  }

  public static async update(
    context: AtContext,
    extensionId: string,
    extension: Partial<Extension>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(extension, [
      'fk_user_id',
      'extension_id',
      'title',
      'kv_store',
      'meta',
      'order',
    ]);

    // set meta
    await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.EXTENSIONS,
      prepareForDb(updateObj, ['kv_store', 'meta']),
      extensionId,
    );

    await AtmosphereCache.update(
      context,
      `${CacheScope.EXTENSION}:${extensionId}`,
      prepareForResponse(updateObj, ['kv_store', 'meta']),
    );

    return this.get(context, extensionId, false, ncMeta);
  }

  static async softDelete(
    context: AtContext,
    extensionId: string,
    deleted: boolean,
    ncMeta = Atmosphere.ncMeta,
  ) {
    await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.EXTENSIONS,
      { deleted },
      extensionId,
    );

    await AtmosphereCache.update(context, `${CacheScope.EXTENSION}:${extensionId}`, {
      deleted,
    });

    // Adjust workspace resource stats cache: -1 on trash, +1 on restore
    await AtmosphereCache.incrHashField(
      'root',
      `${CacheScope.RESOURCE_STATS}:workspace:${context.workspace_id}`,
      PlanLimitTypes.LIMIT_EXTENSION_PER_WORKSPACE,
      deleted ? -1 : 1,
    );
  }

  static async delete(
    context: AtContext,
    extensionId: any,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const res = await ncMeta.metaDelete(
      context.workspace_id,
      context.base_id,
      MetaTable.EXTENSIONS,
      extensionId,
    );

    await AtmosphereCache.deepDel(
      context,
      `${CacheScope.EXTENSION}:${extensionId}`,
      CacheDelDirection.CHILD_TO_PARENT,
    );

    await AtmosphereCache.incrHashField(
      'root',
      `${CacheScope.RESOURCE_STATS}:workspace:${context.workspace_id}`,
      PlanLimitTypes.LIMIT_EXTENSION_PER_WORKSPACE,
      -1,
    );

    return res;
  }

  static async deleteByBaseId(
    context: AtContext,
    baseId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    await ncMeta.metaDelete(
      context.workspace_id,
      context.base_id,
      MetaTable.EXTENSIONS,
      {
        base_id: baseId,
      },
    );

    // clear cache
    await AtmosphereCache.deepDel(
      context,
      `${CacheScope.EXTENSION}:${baseId}:list`,
      CacheDelDirection.PARENT_TO_CHILD,
    );
  }
}
