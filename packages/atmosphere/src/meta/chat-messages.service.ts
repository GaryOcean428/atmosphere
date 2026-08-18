import { Injectable, Optional } from '@nestjs/common';
import type { knex } from 'knex';
import { MetaService } from '~/meta/meta.service';
import { AtConfig } from '~/utils/atm-config';

@Injectable()
export class ChatMessagesService extends MetaService {
  constructor(
    config: AtConfig,
    @Optional() trx = null,
    @Optional() nested = 0,
    @Optional() sharedKnex: knex.Knex | null = null,
  ) {
    super(config, trx, nested, sharedKnex);
  }
}
