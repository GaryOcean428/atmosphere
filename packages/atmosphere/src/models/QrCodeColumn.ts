import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import { CacheGetType, CacheScope, MetaTable } from '~/utils/globals';
import { Column } from '~/models';
import { AtError } from '~/helpers/catchError';

export default class QrCodeColumn {
  base_id?: string;
  fk_workspace_id?: string;
  fk_column_id: string;
  fk_qr_value_column_id: string;
  error: string;

  constructor(data: Partial<QrCodeColumn>) {
    Object.assign(this, data);
  }

  public static async insert(
    context: AtContext,
    qrCode: Partial<QrCodeColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(qrCode, [
      'fk_column_id',
      'fk_qr_value_column_id',
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
      MetaTable.COL_QRCODE,
      insertObj,
    );

    return this.read(context, qrCode.fk_column_id, ncMeta);
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
        `${CacheScope.COL_QRCODE}:${columnId}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!column) {
      column = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.COL_QRCODE,
        { fk_column_id: columnId },
      );
      await AtmosphereCache.set(
        context,
        `${CacheScope.COL_QRCODE}:${columnId}`,
        column,
      );
    }

    return column ? new QrCodeColumn(column) : null;
  }

  id: string;

  async getValueColumn(context: AtContext) {
    return Column.get(context, {
      colId: this.fk_qr_value_column_id,
    });
  }

  public static async update(
    context: AtContext,
    columnId: string,
    data: Partial<QrCodeColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(data, [
      'fk_column_id',
      'fk_qr_value_column_id',
      'error',
    ]);

    await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.COL_QRCODE,
      updateObj,
      {
        fk_column_id: columnId,
      },
    );

    await AtmosphereCache.update(
      context,
      `${CacheScope.COL_QRCODE}:${columnId}`,
      updateObj,
    );
  }
}
