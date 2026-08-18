/**
 * Class to create an instance of KnexMigrator
 *
 * @class KnexMigrator
 * @extends {SqlMigrator}
 */
import KnexMigratorv2 from './KnexMigratorv2';
import type Source from '~/models/Source';
import type { XKnex } from '~/db/CustomKnex';
import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';
import AtConnectionMgrv2 from '~/utils/common/AtConnectionMgrv2';

export default class KnexMigratorv2Tans extends KnexMigratorv2 {
  protected sqlClient: any;
  // todo: tobe changed
  protected ncMeta: any; // AtMetaIO;

  constructor(
    context: AtContext,
    base: { id: string },
    sqlClient = null,
    ncMeta = Atmosphere.ncMeta,
  ) {
    super(context, base);
    this.sqlClient = sqlClient;
    this.ncMeta = ncMeta;
  }

  protected get metaDb(): XKnex {
    return this.ncMeta.knex || Atmosphere.ncMeta.knex;
  }
  protected async getSqlClient(source: Source) {
    return this.sqlClient || AtConnectionMgrv2.getSqlClient(source);
  }
}
