import type { RollupColumn } from '~/models/';
import type { AtContext } from '~/interface/config';
import { Column } from '~/models/';
import LinkToAnotherRecordColumn from '~/models/LinkToAnotherRecordColumn';
import Atmosphere from '~/Atmosphere';

export default class LinksColumn
  extends LinkToAnotherRecordColumn
  implements RollupColumn
{
  rollup_function = 'count' as RollupColumn['rollup_function'];
  error: string;

  get fk_relation_column_id() {
    return this.fk_column_id;
  }
  get fk_rollup_column_id() {
    if (this.type === 'hm') {
      return this.fk_child_column_id;
    } else if (this.type === 'mm') {
      return this.fk_parent_column_id;
    } else if (this.type === 'bt') {
      return this.fk_parent_column_id;
    } else if (this.type === 'oo') {
      return this.fk_parent_column_id;
    }
    // Default fallback for any other types (mo, om, etc.)
    return this.fk_parent_column_id;
  }

  async getRelationColumn(
    context: AtContext,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Column> {
    return await Column.get(context, { colId: this.fk_column_id }, ncMeta);
  }

  async getRollupColumn(
    context: AtContext,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Column> {
    return await Column.get(
      context,
      { colId: this.fk_rollup_column_id },
      ncMeta,
    );
  }

  public static async read(
    context: AtContext,
    columnId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const colData = await super.read(context, columnId, ncMeta);
    return colData && new LinksColumn(colData);
  }

  public static async insert(
    context: AtContext,
    data: Partial<LinksColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const colData = await super.insert(context, data, ncMeta);
    return colData && new LinksColumn(colData);
  }
}
