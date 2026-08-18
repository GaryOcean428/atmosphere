import * as atm_001_init from '~/meta/migrations/docs-content/atm_001_init';
import * as atm_002_doc_revisions from '~/meta/migrations/docs-content/atm_002_doc_revisions';
import * as atm_003_yjs_state from '~/meta/migrations/docs-content/atm_003_yjs_state';

export default class XcMigrationSourceDocsContent {
  public getMigrations(): Promise<any> {
    return Promise.resolve([
      'atm_001_init',
      'atm_002_doc_revisions',
      'atm_003_yjs_state',
    ]);
  }

  public getMigrationName(migration): string {
    return migration;
  }

  public getMigration(migration): any {
    switch (migration) {
      case 'atm_001_init':
        return atm_001_init;
      case 'atm_002_doc_revisions':
        return atm_002_doc_revisions;
      case 'atm_003_yjs_state':
        return atm_003_yjs_state;
    }
  }
}
