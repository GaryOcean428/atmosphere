import { Injectable } from '@nestjs/common';
import type { AtContext, AtRequest, ViewRowColourV3Type } from 'atmosphere-sdk';
import type { MetaService } from '~/meta/meta.service';
import type { ViewWebhookManager } from '~/utils/view-webhook-manager';

@Injectable()
export class ViewRowColorV3Service {
  async replace(
    _context: AtContext,
    _params: {
      viewId: string;
      body: ViewRowColourV3Type;
      req: AtRequest;
      viewWebhookManager?: ViewWebhookManager;
    },
    _ncMeta?: MetaService,
  ) {}
}
