import { AtDebug } from 'atmosphere-gui/utils/debug';
import type { FactoryProvider } from '@nestjs/common';
import type { IEventEmitter } from '~/modules/event-emitter/event-emitter.interface';
import { verifyDefaultWorkspace } from '~/helpers/verifyDefaultWorkspace';
import { isEE, T } from '~/utils';
import { populatePluginsForCloud } from '~/utils/cloud/populateCloudPlugins';
import { MetaService } from '~/meta/meta.service';
import Atmosphere from '~/Atmosphere';
import AtPluginMgrv2 from '~/helpers/AtPluginMgrv2';
import AtUpgrader from '~/version-upgrader/AtUpgrader';
import AtmosphereCache from '~/cache/AtmosphereCache';
import getInstance from '~/utils/getInstance';
import initAdminFromEnv from '~/helpers/initAdminFromEnv';
import { User } from '~/models';
import { AtConfig, prepareEnv } from '~/utils/atm-config';
import { MetaTable, RootScopes } from '~/utils/globals';
import { updateMigrationJobsState } from '~/helpers/migrationJobs';
import { initBaseBehavior } from '~/helpers/initBaseBehaviour';
import initDataSourceEncryption from '~/helpers/initDataSourceEncryption';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';

export const InitMetaServiceProvider: FactoryProvider = {
  // initialize app,
  // 1. init cache
  // 2. init db connection and create if not exist
  // 3. init meta and set to Atmosphere
  // 4. init jwt
  // 5. init plugin manager
  // 6. run upgrader
  useFactory: async (
    eventEmitter: IEventEmitter,
    appHooksService: AppHooksService,
  ) => {
    // ATMOSPHERE_DATABASE_URL_FILE, DATABASE_URL_FILE, DATABASE_URL, ATMOSPHERE_DATABASE_URL to ATMOSPHERE_DB
    await prepareEnv();

    const config = await AtConfig.createByEnv();
    AtDebug.log('Config prepared using environment variables');

    // set version
    process.env.ATMOSPHERE_VERSION = '0258003';

    // set migration jobs version
    process.env.ATMOSPHERE_MIGRATION_JOBS_VERSION = '14';

    // init cache
    await AtmosphereCache.init();
    AtDebug.log('Cache initialized');

    // init meta service
    const metaService = new MetaService(config);

    // check if atm_store exists
    const ncStoreExists = await metaService.knexConnection.schema.hasTable(
      MetaTable.STORE,
    );

    // get instance config
    const instanceConfig = ncStoreExists
      ? await metaService.metaGet(
          RootScopes.ROOT,
          RootScopes.ROOT,
          MetaTable.STORE,
          {
            key: 'ATMOSPHERE_CONFIG_MAIN',
          },
        )
      : null;

    // Avoid upgrading directly from versions lower than 0100002 (ATMOSPHERE_VERSION)
    if (instanceConfig) {
      const configObj: AtConfig = JSON.parse(instanceConfig.value);

      if (+configObj.version < 100002) {
        throw new Error(
          `You are trying to upgrade from an old version of Atmosphere. Please upgrade to 0.207.3 first and then you can upgrade to the latest version.`,
        );
      }
    } else {
      // if bases are present then it is an old version missing the config
      const isOld = (await metaService.legacyProjectList())?.length;
      if (isOld) {
        throw new Error(
          `You are trying to upgrade from an old version of Atmosphere. Please upgrade to 0.207.3 first and then you can upgrade to the latest version.`,
        );
      }
    }

    const v0TableExists = await metaService.knexConnection.schema.hasTable(
      'xc_knex_migrationsv0',
    );
    const v2TableExists = await metaService.knexConnection.schema.hasTable(
      'xc_knex_migrationsv2',
    );
    const v3TableExists = await metaService.knexConnection.schema.hasTable(
      'xc_knex_migrationsv3',
    );

    Atmosphere.firstEeLoad =
      isEE && !v0TableExists && v2TableExists && !v3TableExists;

    await metaService.init();

    AtDebug.log('Meta service initialized');

    // provide meta and config to Atmosphere
    Atmosphere._ncMeta = metaService;
    Atmosphere.appHooksService = appHooksService;
    Atmosphere.config = config;
    Atmosphere.eventEmitter = eventEmitter;

    await Atmosphere.prepareAuditService();
    await Atmosphere.prepareChatMessagesService();
    await Atmosphere.prepareDocsContentService();
    await Atmosphere.prepareOperationLogsService();

    if (!instanceConfig) {
      AtDebug.log('Inserting instance config');
      // bump to latest version for fresh install
      await updateMigrationJobsState({
        version: process.env.ATMOSPHERE_MIGRATION_JOBS_VERSION,
      });
      AtDebug.log('Migration jobs state updated');
    }

    // init jwt secret
    await Atmosphere.initJwt();
    AtDebug.log('JWT initialized');

    // load super admin user from env if env is set
    await initAdminFromEnv(metaService);
    AtDebug.log('Admin user from environment initialized');
    await Atmosphere.loadEEState();

    if (process.env.ATMOSPHERE_LICENSE_KEY) {
      try {
        await populatePluginsForCloud({ ncMeta: Atmosphere.ncMeta });
        AtDebug.log('Cloud plugins initialized from env');
      } catch (e) {
        if (process.env.ATMOSPHERE_CLOUD === 'true') throw e;
        console.error('Plugin init failed', e?.message);
      }
    }

    AtDebug.log('Upgrader starting');
    // run upgrader
    await AtUpgrader.upgrade({ ncMeta: Atmosphere._ncMeta });
    AtDebug.log('Upgrader finished');

    // init plugin manager
    await AtPluginMgrv2.init(Atmosphere.ncMeta);
    AtDebug.log('Plugin manager initialized');

    if (process.env.ATMOSPHERE_CLOUD === 'true') {
      try {
        await populatePluginsForCloud({ ncMeta: Atmosphere.ncMeta });
      } catch (e) {
        if (process.env.NODE_ENV !== 'test') throw e;
      }
    }
    T.init({
      instance: getInstance,
    });
    T.emit('evt_app_started', await User.count());

    // decide base behavior based on env and database permissions
    await initBaseBehavior();
    AtDebug.log('Base behavior initialized');

    // encrypt datasource if secret is set
    await initDataSourceEncryption(metaService);
    AtDebug.log('Datasource encryption initialized');

    await verifyDefaultWorkspace();

    return metaService;
  },
  provide: MetaService,
  inject: ['IEventEmitter', AppHooksService],
};
