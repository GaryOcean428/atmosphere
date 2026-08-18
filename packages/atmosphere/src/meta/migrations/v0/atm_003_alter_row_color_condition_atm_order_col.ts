import type { Knex } from 'knex';
import { MetaTable } from '~/utils/globals';

const up = async (knex: Knex) => {
  // Change atm_order from integer to float
  await knex.schema.alterTable(MetaTable.ROW_COLOR_CONDITIONS, (table) => {
    table.float('atm_order').alter();
  });
};

const down = async (knex: Knex) => {
  // Revert atm_order back to integer
  await knex.schema.alterTable(MetaTable.ROW_COLOR_CONDITIONS, (table) => {
    table.integer('atm_order').alter();
  });
};

export { up, down };
