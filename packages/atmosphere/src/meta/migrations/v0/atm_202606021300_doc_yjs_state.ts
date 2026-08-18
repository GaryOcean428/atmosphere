import type { Knex } from 'knex';
import {
  up as addYjsState,
  down as dropYjsState,
} from '~/meta/migrations/docs-content/atm_003_yjs_state';

// Wrapper for the yjs_state satellite migration. Same schema runs against
// ATMOSPHERE_DOCS_DB when configured (shares the docs satellite DB).
const up = async (knex: Knex) => {
  await addYjsState(knex);
};

const down = async (knex: Knex) => {
  await dropYjsState(knex);
};

export { up, down };
