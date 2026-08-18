import type { AtContext, AtRequest } from 'atmosphere-sdk';
import type { MetaService } from '~/meta/meta.service';

export interface IViewsV3Service {
  getView(
    context: AtContext,
    param: { viewId: string; req: AtRequest },
    ncMeta?: MetaService,
  ): Promise<any>;
}
