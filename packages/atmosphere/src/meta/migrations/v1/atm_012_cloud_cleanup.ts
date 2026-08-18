const up = async (knex) => {
  const tablesToDrop = [
    'atm_plugins',
    'atm_disabled_models_for_role',
    'atm_shared_views',
    'atm_projects_users',
    'atm_roles',
    'atm_hooks',
    'atm_cron',
    'atm_acl',
    'atm_models',
    'atm_relations',
    'atm_routes',
    'atm_resolvers',
    'atm_loaders',
    'atm_rpc',
    'atm_audit',
    'atm_migrations',
    'atm_projects',
  ];

  // check if table exist and remove if exist
  for (const table of tablesToDrop) {
    const tableExist = await knex.schema.hasTable(table);
    if (tableExist) {
      await knex.schema.dropTable(table);
    }
  }
};

const down = async (_knex) => {};

export { up, down };
