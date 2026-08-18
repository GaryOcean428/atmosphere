import * as path from 'path';
import fs from 'fs';
import { promisify } from 'util';
const {
  DriverClient,
  getToolDir,
  metaUrlToDbConfig,
  prepareEnv,
} = require('../atmosphere/cli');

export class AtConfig {
  meta: {
    db: any;
  } = {
    db: {
      client: DriverClient.SQLITE,
      connection: {
        filename: 'atmosphere.db',
      },
    },
  };

  toolDir: string;

  private constructor() {
    this.toolDir = getToolDir();
  }

  public static async create(param: {
    meta: {
      metaUrl?: string;
      metaJson?: string;
      metaJsonFile?: string;
      databaseUrlFile?: string;
      databaseUrl?: string;
    };
    secret?: string;
  }): Promise<AtConfig> {
    const { meta } = param;

    const ncConfig = new AtConfig();

    if (ncConfig.meta?.db?.connection?.filename) {
      ncConfig.meta.db.connection.filename = path.join(
        ncConfig.toolDir,
        ncConfig.meta.db.connection.filename,
      );
    }

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
    });
  }
}

export const getAtmosphereConfig = async (
  options: {
    ncDb?: string;
    ncDbJson?: string;
    ncDbJsonFile?: string;
    databaseUrl?: string;
    databaseUrlFile?: string;
  } = {},
) => {
  // check for JDBC url specified in env or options
  await prepareEnv({
    databaseUrl:
      options.databaseUrl ||
      process.env.ATMOSPHERE_DATABASE_URL ||
      process.env.DATABASE_URL,
    databaseUrlFile:
      options.databaseUrlFile ||
      process.env.ATMOSPHERE_DATABASE_URL_FILE ||
      process.env.DATABASE_URL_FILE,
  });

  // create AtmosphereConfig using utility method which works similar to Atmosphere AtConfig with only meta db config
  return AtConfig.create({
    meta: {
      metaUrl: process.env.ATMOSPHERE_DB || options.ncDb,
      metaJson: process.env.ATMOSPHERE_DB_JSON || options.ncDbJson,
      metaJsonFile: process.env.ATMOSPHERE_DB_JSON_FILE || options.ncDbJsonFile,
    },
  });
};
