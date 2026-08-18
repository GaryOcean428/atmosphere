import { extractProps } from '~/helpers/extractProps';
import Atmosphere from '~/Atmosphere';
import {
  CacheGetType,
  CacheScope,
  MetaTable,
  RootScopes,
} from '~/utils/globals';
import { AtError } from '~/helpers/catchError';
import { Base } from '~/models';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { ATMOSPHERE_DATA_REFLECTION_SETTINGS } from '~/helpers/dataReflectionHelpers';

export default class DataReflection {
  id?: string;
  fk_workspace_id?: string;
  username?: string;
  password?: string;
  database?: string;

  // common variables
  host?: string;
  port?: number;

  constructor(dataReflection: Partial<DataReflection>) {
    Object.assign(this, dataReflection);
  }

  public static async init() {}

  protected static async insert(
    dataReflection: Partial<DataReflection>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertData = extractProps(dataReflection, [
      'fk_workspace_id',
      'username',
      'password',
      'database',
    ]);

    const insertedDataReflection = await ncMeta.metaInsert2(
      RootScopes.ROOT,
      RootScopes.ROOT,
      MetaTable.DATA_REFLECTION,
      insertData,
    );

    return this.get({ id: insertedDataReflection.id });
  }

  public static async get(
    params: {
      id?: string;
      fk_workspace_id?: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const condition = extractProps(params, ['id', 'fk_workspace_id']);

    if (!condition.id && !condition.fk_workspace_id) {
      AtError.badRequest('id or fk_workspace_id is required');
    }

    let dataReflection = condition.id
      ? await AtmosphereCache.get(
          'root',
          `${CacheScope.DATA_REFLECTION}:${condition.id}`,
          CacheGetType.TYPE_OBJECT,
        )
      : condition.fk_workspace_id
      ? await AtmosphereCache.get(
          'root',
          `${CacheScope.DATA_REFLECTION}:${condition.fk_workspace_id}`,
          CacheGetType.TYPE_OBJECT,
        )
      : null;
    if (!dataReflection) {
      dataReflection = await ncMeta.metaGet2(
        RootScopes.ROOT,
        RootScopes.ROOT,
        MetaTable.DATA_REFLECTION,
        condition,
      );

      if (!dataReflection) {
        return null;
      }

      dataReflection.host = ATMOSPHERE_DATA_REFLECTION_SETTINGS.host;
      dataReflection.port = ATMOSPHERE_DATA_REFLECTION_SETTINGS.port;

      if (dataReflection) {
        await AtmosphereCache.set(
          'root',
          `${CacheScope.DATA_REFLECTION}:${dataReflection.id}`,
          dataReflection,
        );

        await AtmosphereCache.set(
          'root',
          `${CacheScope.DATA_REFLECTION}:${dataReflection.fk_workspace_id}`,
          dataReflection,
        );
      }
    }

    return new DataReflection(dataReflection);
  }

  protected static async delete(
    params: {
      id?: string;
      fk_workspace_id?: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const condition = extractProps(params, ['id', 'fk_workspace_id']);

    if (!condition.id && !condition.fk_workspace_id) {
      AtError.badRequest('id or fk_workspace_id is required');
    }

    const dataReflection = await this.get(condition, ncMeta);

    if (!dataReflection) {
      return;
    }

    await AtmosphereCache.del(
      'root',
      `${CacheScope.DATA_REFLECTION}:${dataReflection.id}`,
    );
    await AtmosphereCache.del(
      'root',
      `${CacheScope.DATA_REFLECTION}:${dataReflection.fk_workspace_id}`,
    );

    await ncMeta.metaDelete(
      RootScopes.ROOT,
      RootScopes.ROOT,
      MetaTable.DATA_REFLECTION,
      condition,
    );
  }

  public static async availableSchemas(
    fk_workspace_id: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const data = await Base.list(fk_workspace_id, ncMeta);

    return data.map((base) => base.id);
  }

  public static async create(
    fk_workspace_id: string,
    _ncMeta = Atmosphere.ncMeta,
  ): Promise<DataReflection> {
    AtError.notImplemented('Data Reflection');
  }

  public static async destroy(
    fk_workspace_id: string,
    _ncMeta = Atmosphere.ncMeta,
  ): Promise<void> {
    return;
  }

  public static async grantBase(
    fk_workspace_id: string,
    base_id: string,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return;
  }

  public static async revokeBase(
    fk_workspace_id: string,
    base_id: string,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return;
  }
}
