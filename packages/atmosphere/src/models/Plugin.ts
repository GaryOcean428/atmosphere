import type { PluginType } from 'atmosphere-sdk';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import {
  CacheGetType,
  CacheScope,
  MetaTable,
  RootScopes,
} from '~/utils/globals';

export default class Plugin implements PluginType {
  id?: string;
  title?: string;
  description?: string;
  active?: boolean;
  rating?: number;
  version?: string;
  docs?: string;
  status?: string;
  status_details?: string;
  logo?: string;
  icon?: string;
  tags?: string;
  category?: string;
  input_schema?: string;
  input?: string | null;
  creator?: string;
  creator_website?: string;
  price?: string;

  constructor(audit: Partial<PluginType>) {
    Object.assign(this, audit);
  }

  public static async get(pluginId: string, ncMeta = Atmosphere.ncMeta) {
    let plugin =
      pluginId &&
      (await AtmosphereCache.get(
        'root',
        `${CacheScope.PLUGIN}:${pluginId}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!plugin) {
      plugin = await ncMeta.metaGet2(
        RootScopes.ROOT,
        RootScopes.ROOT,
        MetaTable.PLUGIN,
        pluginId,
      );
      await AtmosphereCache.set('root', `${CacheScope.PLUGIN}:${pluginId}`, plugin);
    }
    return plugin && new Plugin(plugin);
  }

  static async list(ncMeta = Atmosphere.ncMeta) {
    const cachedList = await AtmosphereCache.getList('root', CacheScope.PLUGIN, []);
    let { list: pluginList } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !pluginList.length) {
      pluginList = await ncMeta.metaList2(
        RootScopes.ROOT,
        RootScopes.ROOT,
        MetaTable.PLUGIN,
      );
      await AtmosphereCache.setList('root', CacheScope.PLUGIN, [], pluginList);
    }
    return pluginList;
  }

  static async count(ncMeta = Atmosphere.ncMeta): Promise<number> {
    return (await ncMeta.knex(MetaTable.PLUGIN).count('id', { as: 'count' }))
      ?.count;
  }

  public static async update(pluginId: string, plugin: Partial<PluginType>) {
    const updateObj = extractProps(plugin, ['input', 'active']);

    if (updateObj.input && typeof updateObj.input === 'object') {
      updateObj.input = JSON.stringify(updateObj.input);
    }

    // set meta
    await Atmosphere.ncMeta.metaUpdate(
      RootScopes.ROOT,
      RootScopes.ROOT,
      MetaTable.PLUGIN,
      updateObj,
      pluginId,
    );

    await AtmosphereCache.update(
      'root',
      `${CacheScope.PLUGIN}:${pluginId}`,
      updateObj,
    );

    return this.get(pluginId);
  }

  public static async isPluginActive(id: string, ncMeta = Atmosphere.ncMeta) {
    return !!(
      (await this.getPlugin(id, ncMeta)) ||
      (await this.getPluginByTitle(id, ncMeta))
    )?.active;
  }

  /**
   * get plugin by id
   */
  public static async getPlugin(id: string, ncMeta = Atmosphere.ncMeta) {
    let plugin =
      id &&
      (await AtmosphereCache.get(
        'root',
        `${CacheScope.PLUGIN}:${id}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!plugin) {
      plugin = await ncMeta.metaGet2(
        RootScopes.ROOT,
        RootScopes.ROOT,
        MetaTable.PLUGIN,
        id,
      );
      await AtmosphereCache.set('root', `${CacheScope.PLUGIN}:${id}`, plugin);
    }
    return plugin;
  }

  // keeping it for backward compatibility, if someone configured google auth via plugin it still relies on this
  static async getPluginByTitle(title: string, ncMeta = Atmosphere.ncMeta) {
    return await ncMeta.metaGet2(
      RootScopes.ROOT,
      RootScopes.ROOT,
      MetaTable.PLUGIN,
      { title },
    );
  }
}
