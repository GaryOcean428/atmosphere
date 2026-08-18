import debug from 'debug';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CleanupDuplicateColumnMigration {
  private readonly debugLog = debug(
    'atm:migration-jobs:cleanup-duplicate-column',
  );

  constructor() {}

  log = (...msgs: string[]) => {
    console.log('[atm_job_004_cleanup_duplicate_column]: ', ...msgs);
  };

  async job() {
    // cloud only migration so keep as empty
    return true;
  }
}
