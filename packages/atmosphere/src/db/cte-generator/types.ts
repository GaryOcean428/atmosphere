import type { Knex } from 'knex';
import type { ClientType, AtContext } from 'atmosphere-sdk';
import type CustomKnex from '~/db/CustomKnex';

export interface ICteBlock<T = any> {
  applyCte: (
    qb: Knex.QueryInterface,
    param: { context: AtContext; knex: CustomKnex },
  ) => void;
  alias: string; // to prevent multiple alias defined
  extra?: T;
}

export interface ICTEGenerator {
  baseUser(param: {
    context?: AtContext;
    include_ws_deleted?: boolean;
    mode?: 'viewer' | 'full';
  }): Promise<ICteBlock>;

  getExistingAlias(alias: string): ICteBlock;
  getCteModules<T>(
    moduleName: 'baseUser' | 'lookup' | 'links',
    clientType: ClientType,
  ): T;

  applyCte(qb: Knex.QueryInterface): void;
  customCte(cteBlock: ICteBlock): ICteBlock;
}
