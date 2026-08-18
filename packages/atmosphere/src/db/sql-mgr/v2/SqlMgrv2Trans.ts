import KnexMigratorv2Tans from '../../sql-migrator/lib/KnexMigratorv2Tans';
import SqlMgrv2 from './SqlMgrv2';
import type { Knex } from 'knex';
import type { XKnex } from '../../CustomKnex';
import type Source from '~/models/Source';
import type { AtContext } from '~/interface/config';
import AtConnectionMgrv2 from '~/utils/common/AtConnectionMgrv2';

export default class SqlMgrv2Trans extends SqlMgrv2 {
  protected trx: Knex.Transaction;
  // todo: tobe changed
  protected ncMeta: any; // AtMetaIO;
  protected baseId: string;
  protected source: Source;

  /**
   * Creates an instance of SqlMgr.
   * @param {*} args
   * @param {String} args.toolDbPath - path to sqlite file that sql mgr will use
   * @memberof SqlMgr
   */
  // todo: tobe changed
  constructor(
    context: AtContext,
    args: { id: string },
    ncMeta: any,
    source: Source,
  ) {
    super(context, args);
    this.baseId = args.id;
    this.ncMeta = ncMeta;
    this.source = source;
  }

  public async migrator() {
    return new KnexMigratorv2Tans(
      this.context,
      { id: this.baseId },
      await this.getSqlClient(this.source),
      this.ncMeta,
    );
  }

  public async startTransaction(source: Source) {
    const knex: XKnex = await AtConnectionMgrv2.get(source);
    this.trx = await knex.transaction();
  }

  public async commit() {
    if (this.trx) {
      await this.trx.commit();
      this.trx = null;
    }
  }

  public async rollback(error?) {
    if (this.trx) {
      await this.trx.rollback(error);
      this.trx = null;
    }
  }

  protected async getSqlClient(source: Source) {
    return AtConnectionMgrv2.getSqlClient(source, this.trx);
  }

  public async sqlOp(source: Source, op, opArgs): Promise<any> {
    return super.sqlOp(source, op, opArgs);
  }

  public async sqlOpPlus(source: Source, op, opArgs): Promise<any> {
    return super.sqlOpPlus(source, op, opArgs);
  }
}
