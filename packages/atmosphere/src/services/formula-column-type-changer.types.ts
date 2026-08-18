import type { BaseModelSqlv2 } from 'src/db/BaseModelSqlv2';
import type { ColumnReqType, AtContext, AtRequest, UserType } from 'atmosphere-sdk';
import type { Column } from '~/models';
import type { ReusableParams } from '~/services/columns.service.type';

export interface IFormulaColumnTypeChanger {
  startChangeFormulaColumnType(
    context: AtContext,
    params: {
      req: AtRequest;
      formulaColumn: Column;
      user: UserType;
      reuse?: ReusableParams;
      newColumnRequest: ColumnReqType & { colOptions?: any };
    },
  ): Promise<void>;

  startMigrateData(
    context: AtContext,
    {
      formulaColumn,
      destinationColumn,
      baseModel,
    }: {
      formulaColumn: Column;
      destinationColumn: Column;
      baseModel?: BaseModelSqlv2;
    },
  ): Promise<void>;
}
