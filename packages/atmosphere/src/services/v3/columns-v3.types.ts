import type { AtContext } from 'atmosphere-sdk';
import type { MetaService } from '~/meta/meta.service';

export interface IColumnsV3Service {
  columnGet(
    context: AtContext,
    param: { columnId: string },
    ncMeta?: MetaService,
  ): Promise<any>;
}
