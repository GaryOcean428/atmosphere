import { Injectable, Logger } from '@nestjs/common';
import type { MetaService } from '~/meta/meta.service';
import type { AtContext, AtRequest } from '~/interface/config';
import type { IViewsV3Service } from '~/services/v3/views-v3.types';

@Injectable()
export class ViewsV3Service implements IViewsV3Service {
  protected logger = new Logger(ViewsV3Service.name);
  constructor() {}

  async getView(
    _context: AtContext,
    _param: { viewId: string; req: AtRequest },
    _ncMeta?: MetaService,
  ) {
    return undefined;
  }
}
