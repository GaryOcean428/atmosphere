import { AtError } from 'src/helpers/catchError';
import { DecimalGeneralHandler } from '../decimal/decimal.general.handler';
import type { Column } from 'src/models';
import type { IBaseModelSqlV2 } from 'src/db/IBaseModelSqlV2';
import type { AtContext } from 'atmosphere-sdk';
import type { MetaService } from 'src/meta/meta.service';

export class NumberGeneralHandler extends DecimalGeneralHandler {
  override async parseUserInput(params: {
    value: any;
    row: any;
    column: Column;
    options?: {
      baseModel?: IBaseModelSqlV2;
      context?: AtContext;
      metaService?: MetaService;
    };
  }): Promise<{ value: any }> {
    const value = (await super.parseUserInput(params))?.value;
    if (typeof value === 'number' && Math.floor(value) !== Math.ceil(value)) {
      AtError.invalidValueForField({
        value: params.value,
        column: params.column.title,
        type: params.column.uidt,
      });
    }
    return { value };
  }
}
