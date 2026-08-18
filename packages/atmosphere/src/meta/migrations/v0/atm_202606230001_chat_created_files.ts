import type { Knex } from 'knex';
import {
  up as addCreatedFiles,
  down as dropCreatedFiles,
} from '~/meta/migrations/chat-messages/atm_003_created_files';

// Adds `created_files` to atm_chat_messages on the main meta DB. The canonical
// schema lives in chat-messages/atm_003_created_files (shared with the satellite
// DB migration source), so this just delegates to it.
const up = async (knex: Knex) => {
  await addCreatedFiles(knex);
};

const down = async (knex: Knex) => {
  await dropCreatedFiles(knex);
};

export { up, down };
