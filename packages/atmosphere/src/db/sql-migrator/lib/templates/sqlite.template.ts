import path from 'path';

const { DOCKER_DB_FILE } = process.env;

export default {
  title: 'default',
  envs: {
    _atmosphere: {
      db: [
        {
          client: 'sqlite3',
          connection: {
            client: 'sqlite3',
            connection: {
              filename:
                DOCKER_DB_FILE ||
                `${path.join(process.cwd(), 'xmigrator', 'default_dev.db')}`,
            },
            useNullAsDefault: true,
          },
          meta: {
            tn: 'atm_evolutions',
            dbAlias: 'primary',
          },
        },
      ],
    },
    test: {
      api: {},
      db: [
        {
          client: 'sqlite3',
          connection: {
            client: 'sqlite3',
            connection: {
              filename:
                DOCKER_DB_FILE ||
                `${path.join(process.cwd(), 'xmigrator', 'default_test.db')}`,
            },
            useNullAsDefault: true,
          },
          meta: {
            tn: 'atm_evolutions',
            dbAlias: 'primary',
          },
        },
      ],
    },
  },
  workingEnv: '_atmosphere',
  meta: {
    version: '0.5',
    seedsFolder: 'seeds',
    queriesFolder: 'queries',
    apisFolder: 'apis',
    orm: 'sequelize',
    router: 'express',
  },
};
