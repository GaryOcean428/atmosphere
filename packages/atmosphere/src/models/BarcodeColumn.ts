import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import { CacheGetType, CacheScope, MetaTable } from '~/utils/globals';
import { Column } from '~/models/index';
import { AtError } from '~/helpers/catchError';

export default class BarcodeColumn {
  id: string;
  fk_workspace_id?: string;
  fk_base_id?: string;
  fk_column_id: string;
  fk_barcode_value_column_id: string;
  barcode_format: string;
  error: string;

  constructor(data: Partial<BarcodeColumn>) {
    Object.assign(this, data);
  }

  public static async insert(
    context: AtContext,
    barcodeColumn: Partial<BarcodeColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(barcodeColumn, [
      'fk_column_id',
      'fk_barcode_value_column_id',
      'barcode_format',
      'error',
    ]);

    const column = await Column.get(
      context,
      {
        colId: insertObj.fk_column_id,
      },
      ncMeta,
    );

    if (!column) {
      AtError.fieldNotFound(insertObj.fk_column_id);
    }

    await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.COL_BARCODE,
      insertObj,
    );

    return this.read(context, barcodeColumn.fk_column_id, ncMeta);
  }

  public static async read(
    context: AtContext,
    columnId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    let column =
      columnId &&
      (await AtmosphereCache.get(
        context,
        `${CacheScope.COL_BARCODE}:${columnId}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!column) {
      column = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.COL_BARCODE,
        { fk_column_id: columnId },
      );
      await AtmosphereCache.set(
        context,
        `${CacheScope.COL_BARCODE}:${columnId}`,
        column,
      );
    }

    return column ? new BarcodeColumn(column) : null;
  }

  async getValueColumn(context: AtContext, ncMeta = Atmosphere.ncMeta) {
    return Column.get(
      context,
      {
        colId: this.fk_barcode_value_column_id,
      },
      ncMeta,
    );
  }

  public static async update(
    context: AtContext,
    columnId: string,
    data: Partial<BarcodeColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(data, [
      'fk_column_id',
      'fk_barcode_value_column_id',
      'barcode_format',
      'error',
    ]);

    await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.COL_BARCODE,
      updateObj,
      {
        fk_column_id: columnId,
      },
    );

    await AtmosphereCache.update(
      context,
      `${CacheScope.COL_BARCODE}:${columnId}`,
      updateObj,
    );
  }
}
