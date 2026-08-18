import { Logger } from '@nestjs/common';
import { AtBaseError } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import { AtError } from '~/helpers/ncError';
import { MetaTable } from '~/cli';
import { extractProps } from '~/helpers/extractProps';
import Atmosphere from '~/Atmosphere';
import { isReplay } from '~/helpers/replayScope';

export interface IRowColorCondition {
  id: string;
  fk_view_id: string;
  fk_workspace_id?: string;
  base_id?: string;
  color: string;
  atm_order: number;
  is_set_as_background: boolean;
  type: string;
  fk_target_column_id?: string;
}
const logger = new Logger('RowColorCondition');
export default class RowColorCondition implements IRowColorCondition {
  id: string;
  fk_view_id: string;
  fk_workspace_id?: string;
  base_id?: string;
  color: string;
  atm_order: number;
  is_set_as_background: boolean;
  type: string;
  fk_target_column_id?: string;

  constructor(data: RowColorCondition) {
    Object.assign(this, data);
  }

  static async insert(
    context: AtContext,
    condition: Partial<IRowColorCondition>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(condition, [
      'fk_view_id',
      'fk_workspace_id',
      'base_id',
      'color',
      'atm_order',
      'is_set_as_background',
      'type',
      'fk_target_column_id',
    ]) as Partial<IRowColorCondition>;

    if (isReplay() && condition.id) {
      (insertObj as Partial<IRowColorCondition> & { id?: string }).id =
        condition.id;
    }

    const row = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.ROW_COLOR_CONDITIONS,
      insertObj,
    );

    return new RowColorCondition(row);
  }

  static async getById(context: AtContext, id: string, ncMeta = Atmosphere.ncMeta) {
    const condition = await ncMeta.metaGet(
      context.workspace_id,
      context.base_id,
      MetaTable.ROW_COLOR_CONDITIONS,
      id,
    );
    if (condition) {
      return new RowColorCondition(condition);
    } else {
      return undefined;
    }
  }

  static async getByViewId(
    context: AtContext,
    fk_view_id: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    return (
      await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.ROW_COLOR_CONDITIONS,
        {
          condition: {
            fk_view_id,
          },
        },
      )
    ).map((row) => new RowColorCondition(row));
  }

  static async delete(context: AtContext, id: string, ncMeta = Atmosphere.ncMeta) {
    const ncMetaTrans = await ncMeta.startTransaction();

    try {
      await ncMetaTrans.metaDelete(
        context.workspace_id,
        context.base_id,
        MetaTable.ROW_COLOR_CONDITIONS,
        {
          id: id,
        },
      );

      await ncMetaTrans.metaDelete(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          fk_row_color_condition_id: id,
        },
      );
      await ncMetaTrans.commit();
    } catch (ex) {
      await ncMetaTrans.rollback();
      if (ex instanceof AtError || ex instanceof AtBaseError) throw ex;
      logger.error('Failed to remove Row Colouring', ex);
      AtError.get(context).internalServerError(
        'Failed to remove Row Colouring',
      );
    }
  }
}
