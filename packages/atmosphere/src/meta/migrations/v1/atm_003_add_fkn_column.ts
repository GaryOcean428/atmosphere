import type { Knex } from 'knex';

const up = async (knex: Knex) => {
  await knex.schema.alterTable('atm_relations', (table) => {
    table.string('fkn');
  });
};

const down = async (knex) => {
  await knex.schema.alterTable('atm_relations', (table) => {
    table.dropColumns('fkn');
  });
};

export { up, down };
