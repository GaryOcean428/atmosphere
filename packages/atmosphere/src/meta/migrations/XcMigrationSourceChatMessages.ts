import * as atm_001_init from '~/meta/migrations/chat-messages/atm_001_init';
import * as atm_002_base_id from '~/meta/migrations/chat-messages/atm_002_base_id';
import * as atm_003_created_files from '~/meta/migrations/chat-messages/atm_003_created_files';
import * as atm_004_ui_context_record from '~/meta/migrations/chat-messages/atm_004_ui_context_record';

export default class XcMigrationSourceChatMessages {
  public getMigrations(): Promise<any> {
    return Promise.resolve([
      'atm_001_init',
      'atm_002_base_id',
      'atm_003_created_files',
      'atm_004_ui_context_record',
    ]);
  }

  public getMigrationName(migration): string {
    return migration;
  }

  public getMigration(migration): any {
    switch (migration) {
      case 'atm_001_init':
        return atm_001_init;
      case 'atm_002_base_id':
        return atm_002_base_id;
      case 'atm_003_created_files':
        return atm_003_created_files;
      case 'atm_004_ui_context_record':
        return atm_004_ui_context_record;
    }
  }
}
