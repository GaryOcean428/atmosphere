import type { AtContext } from 'atmosphere-sdk';
import type { Model } from '~/models';

// this class is reserved for future update
export class ModelWebhookManager {
  constructor(
    protected readonly params: {
      context: AtContext;
      modelId: string;
      model: Model;
    },
  ) {}
}
