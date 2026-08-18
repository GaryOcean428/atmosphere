import type { LookupType } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import Column from '~/models/Column';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import { CacheGetType, CacheScope, MetaTable } from '~/utils/globals';

export default class LookupColumn implements LookupType {
  fk_relation_column_id: string;
  fk_lookup_column_id: string;
  fk_column_id: string;
  error: string;

  constructor(data: Partial<LookupColumn>) {
    Object.assign(this, data);
  }

  public async getRelationColumn(context: AtContext): Promise<Column> {
    return await Column.get(context, {
      colId: this.fk_relation_column_id,
    });
  }

  public async getLookupColumn(context: AtContext): Promise<Column> {
    return await Column.get(context, {
      colId: this.fk_lookup_column_id,
    });
  }

  public static async insert(
    context: AtContext,
    data: Partial<LookupColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(data, [
      'fk_column_id',
      'fk_relation_column_id',
      'fk_lookup_column_id',
      'error',
    ]);

    await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.COL_LOOKUP,
      insertObj,
    );

    return this.read(context, data.fk_column_id, ncMeta).then(
      async (lookupColumn) => {
        await AtmosphereCache.appendToList(
          context,
          CacheScope.COL_LOOKUP,
          [data.fk_lookup_column_id],
          `${CacheScope.COL_LOOKUP}:${data.fk_column_id}`,
        );

        await AtmosphereCache.appendToList(
          context,
          CacheScope.COL_LOOKUP,
          [data.fk_relation_column_id],
          `${CacheScope.COL_LOOKUP}:${data.fk_column_id}`,
        );

        return lookupColumn;
      },
    );
  }

  public static async read(
    context: AtContext,
    columnId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    let colData =
      columnId &&
      (await AtmosphereCache.get(
        context,
        `${CacheScope.COL_LOOKUP}:${columnId}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!colData) {
      colData = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.COL_LOOKUP,
        { fk_column_id: columnId },
      );
      await AtmosphereCache.set(
        context,
        `${CacheScope.COL_LOOKUP}:${columnId}`,
        colData,
      );
    }
    return colData ? new LookupColumn(colData) : null;
  }

  id: string;

  public static async update(
    context: AtContext,
    columnId: string,
    data: Partial<LookupColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(data, [
      'fk_column_id',
      'fk_relation_column_id',
      'fk_lookup_column_id',
      'error',
    ]);

    await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.COL_LOOKUP,
      updateObj,
      {
        fk_column_id: columnId,
      },
    );

    await AtmosphereCache.update(
      context,
      `${CacheScope.COL_LOOKUP}:${columnId}`,
      updateObj,
    );
  }
}
