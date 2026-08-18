import { getNumericValue, type AtContext, parseProp } from 'atmosphere-sdk';
import { DecimalGeneralHandler } from '../decimal/decimal.general.handler';
import type { IBaseModelSqlV2 } from 'src/db/IBaseModelSqlV2';
import type { MetaService } from 'src/meta/meta.service';
import type { Column } from 'src/models';
import { AtError } from '~/helpers/ncError';

export class CurrencyGeneralHandler extends DecimalGeneralHandler {
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
    if (typeof params.value === 'string') {
      const locale = parseProp(params.column.meta).currency_locale;

      const numericValueResult = getNumericValue(params.value, locale);
      if (!numericValueResult.isValid) {
        AtError._.invalidValueForField({
          value: params.value,
          column: params.column.title,
          type: params.column.uidt,
        });
      }
      return { value: numericValueResult.numericValue };
    }
    return super.parseUserInput(params);
  }
}
