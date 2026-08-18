import type { Knex } from 'knex';
import { MetaTable } from '~/utils/globals';

const up = async (knex: Knex) => {
  console.time('atm_073_file_reference_indexes');

  await knex.schema.alterTable(MetaTable.FILE_REFERENCES, (table) => {
    table.index(['base_id', 'fk_workspace_id'], 'atm_fr_context');
  });

  await knex.schema.alterTable(MetaTable.FILE_REFERENCES, (table) => {
    // this index is used on migration, so we are dropping it now
    if (!knex.client.config.client.includes('mysql')) {
      table.dropIndex(['file_url', 'storage'], 'atm_file_references_temp');
    }
  });

  console.timeEnd('atm_073_file_reference_indexes');
};

const down = async (knex) => {
  await knex.schema.alterTable(MetaTable.FILE_REFERENCES, (table) => {
    table.dropIndex('atm_fr_context');
  });

  await knex.schema.alterTable(MetaTable.FILE_REFERENCES, (table) => {
    table.index(['file_url', 'storage'], 'atm_file_references_temp');
  });
};

export { up, down };
