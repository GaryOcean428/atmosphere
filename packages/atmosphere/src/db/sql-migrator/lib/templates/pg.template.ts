const { DOCKER_DB_HOST, DOCKER_DB_PORT } = process.env;

export default {
  title: 'default',
  envs: {
    _atmosphere: {
      db: [
        {
          client: 'pg',
          connection: {
            host: DOCKER_DB_HOST || 'localhost',
            port: DOCKER_DB_PORT || 5432,
            user: 'postgres',
            password: 'password',
            database: 'default_dev',
          },
          meta: {
            tn: 'atm_evolutions',
            dbAlias: 'primary',
          },
        },
      ],
    },
    test: {
      db: [
        {
          client: 'pg',
          connection: {
            host: DOCKER_DB_HOST || 'localhost',
            port: DOCKER_DB_PORT || 5432,
            user: 'postgres',
            password: 'password',
            database: 'default_test',
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
