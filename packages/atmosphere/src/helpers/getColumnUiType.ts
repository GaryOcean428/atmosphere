import { SqlUiFactory } from 'atmosphere-sdk';
import type Source from '~/models/Source';
import type Column from '~/models/Column';
import type { ColumnType } from 'atmosphere-sdk';

export default function getColumnUiType(
  source: Source,
  column: Column | ColumnType,
) {
  const sqlUi = SqlUiFactory.create({ client: source.type });
  return sqlUi.getMetaUIDataType(column as ColumnType);
}
