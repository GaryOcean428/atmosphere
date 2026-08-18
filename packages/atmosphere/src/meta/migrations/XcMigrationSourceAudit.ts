import * as atm_001_init from '~/meta/migrations/audit/atm_001_init';
import * as atm_002_add_org_id from '~/meta/migrations/audit/atm_002_add_org_id';

// Create a custom migration source class
export default class XcMigrationSourcev2 {
  // Must return a Promise containing a list of migrations.
  // Migrations can be whatever you want, they will be passed as
  // arguments to getMigrationName and getMigration
  public getMigrations(): Promise<any> {
    // In this run we are just returning migration names
    return Promise.resolve(['atm_001_init', 'atm_002_add_org_id']);
  }

  public getMigrationName(migration): string {
    return migration;
  }

  public getMigration(migration): any {
    switch (migration) {
      case 'atm_001_init':
        return atm_001_init;
      case 'atm_002_add_org_id':
        return atm_002_add_org_id;
    }
  }
}
