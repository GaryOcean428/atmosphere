import UpoCloud from './UpoCloud';
import type { IStorageAdapterV2 } from '~/types/atm-plugin';
import { XcStoragePlugin } from '~/types/atm-plugin';

class UpCloudPlugin extends XcStoragePlugin {
  private static storageAdapter: UpoCloud;

  public getAdapter(): IStorageAdapterV2 {
    return UpCloudPlugin.storageAdapter;
  }

  public async init(config: any): Promise<any> {
    UpCloudPlugin.storageAdapter = new UpoCloud(config);
    await UpCloudPlugin.storageAdapter.init();
  }
}

export default UpCloudPlugin;
