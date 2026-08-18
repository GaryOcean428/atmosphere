import * as path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { getToolDir, metaUrlToDbConfig } from './helpers';
import { DriverClient } from './interfaces';
import type { DbConfig } from './interfaces';
import { SqlClientFactory } from '~/db/sql-client/lib/SqlClientFactory';
import { ncSiteUrl } from '~/utils/envs';

export class AtConfig {
  version: string;
  meta: {
    db: DbConfig;
  } = {
    db: {
      client: DriverClient.SQLITE,
      connection: {
        filename: 'atmosphere.db',
      },
    },
  };
  auth: {
    jwt: {
      secret: string;
      options?: any;
    };
  };

  // if this is true, port is not exposed
  worker: boolean;

  toolDir: string;

  // exposed instance port
  port: number;

  // if this is true, use sqlite3 :memory: as meta db
  try: boolean;

  // optional
  ncSiteUrl?: string;
  dashboardPath?: string;

  queriesFolder: string;
  env: string;
  workingEnv: string;
  baseType: string;

  private constructor() {}

  public static async create(param: {
    meta: {
      metaUrl?: string;
      metaJson?: string;
      metaJsonFile?: string;
    };
    secret?: string;
    port?: string | number;
    tryMode?: boolean;
    worker?: boolean;
    dashboardPath?: string;
    ncSiteUrl?: string;
  }): Promise<AtConfig> {
    const { meta, secret, port, worker, tryMode, ncSiteUrl, dashboardPath } =
      param;

    const ncConfig = new AtConfig();

    ncConfig.auth = {
      jwt: {
        secret: secret,
      },
    };

    ncConfig.port = +(port ?? 8080);
    ncConfig.toolDir = getToolDir();
    ncConfig.worker = worker ?? false;

    ncConfig.env = '_atmosphere';
    ncConfig.workingEnv = '_atmosphere';

    ncConfig.baseType = 'rest';

    if (ncConfig.meta?.db?.connection?.filename) {
      ncConfig.meta.db.connection.filename = path.join(
        ncConfig.toolDir,
        ncConfig.meta.db.connection.filename,
      );
    }

    if (tryMode) {
      ncConfig.try = true;
      ncConfig.meta.db = {
        client: DriverClient.SQLITE,
        connection: ':memory:' as any,
        pool: {
          min: 1,
          max: 1,
          // disposeTimeout: 360000*1000,
          idleTimeoutMillis: 360000 * 1000,
        },
      };
    } else {
      if (meta?.metaUrl) {
        ncConfig.meta.db = await metaUrlToDbConfig(meta.metaUrl);
      } else if (meta?.metaJson) {
        ncConfig.meta.db = JSON.parse(meta.metaJson);
      } else if (meta?.metaJsonFile) {
        if (!(await promisify(fs.exists)(meta.metaJsonFile))) {
          throw new Error(`ATMOSPHERE_DB_JSON_FILE not found: ${meta.metaJsonFile}`);
        }
        const fileContent = await promisify(fs.readFile)(meta.metaJsonFile, {
          encoding: 'utf8',
        });
        ncConfig.meta.db = JSON.parse(fileContent);
      }
    }

    if (ncSiteUrl) {
      ncConfig.ncSiteUrl = ncSiteUrl;
    }

    if (dashboardPath) {
      ncConfig.dashboardPath = dashboardPath;
    } else {
      ncConfig.dashboardPath = '/';
    }

    try {
      // make sure meta db exists
      await ncConfig.metaDbCreateIfNotExist();
    } catch (e) {
      throw new Error(e);
    }

    return ncConfig;
  }

  public static async createByEnv(): Promise<AtConfig> {
    return AtConfig.create({
      meta: {
        metaUrl: process.env.ATMOSPHERE_DB,
        metaJson: process.env.ATMOSPHERE_DB_JSON,
        metaJsonFile: process.env.ATMOSPHERE_DB_JSON_FILE,
      },
      secret: process.env.ATMOSPHERE_AUTH_JWT_SECRET,
      port: process.env.ATMOSPHERE_PORT,
      tryMode: !!process.env.ATMOSPHERE_TRY,
      worker: !!process.env.ATMOSPHERE_WORKER,
      dashboardPath: process.env.ATMOSPHERE_DASHBOARD_URL ?? '/',
      ncSiteUrl,
    });
  }

  private async metaDbCreateIfNotExist() {
    if (this.meta?.db?.client === 'sqlite3') {
      const metaSqlClient = await SqlClientFactory.create({
        ...this.meta.db,
        connection: this.meta.db,
      });
      if (this.meta.db?.connection?.filename) {
        await metaSqlClient.createDatabaseIfNotExists({
          database: this.meta.db?.connection?.filename,
        });
      } else {
        throw new Error('Meta database configuration missing SQLite file name');
      }
      await metaSqlClient.knex.destroy();
    } else {
      const metaSqlClient = await SqlClientFactory.create(this.meta.db);
      if (this.meta.db?.connection?.database) {
        await metaSqlClient.createDatabaseIfNotExists(
          (this.meta.db as any).connection,
        );
        await metaSqlClient.knex.destroy();
      } else {
        throw new Error('Meta database configuration missing database name');
      }
    }
  }

  static get isAuditEnabled() {
    return process.env.ATMOSPHERE_ENABLE_AUDIT === 'true';
  }
}
