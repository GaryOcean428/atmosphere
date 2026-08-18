import { GenericFieldHandler } from './generic';
import type { AtContext } from 'atmosphere-sdk';
import type { IBaseModelSqlV2 } from 'src/db/IBaseModelSqlV2';
import type { MetaService } from 'src/meta/meta.service';
import type { Column } from 'src/models';

export class ComputedFieldHandler extends GenericFieldHandler {
  override async parseUserInput(_params: {
    value: any;
    row: any;
    column: Column;
    options?: {
      context?: AtContext;
      metaService?: MetaService;
      baseModel?: IBaseModelSqlV2;
    };
  }): Promise<{ value: any }> {
    return {
      value: undefined,
    };
  }
}
