import { MetaService } from '~/meta/meta.service';
import { AtConfig } from '~/utils/atm-config';
import Atmosphere from '~/Atmosphere';

// run upgrader
import AtUpgrader from '~/version-upgrader/AtUpgrader';

export default async () => {
  const config = await AtConfig.createByEnv();
  Atmosphere._ncMeta = new MetaService(config);
  await AtUpgrader.upgrade({ ncMeta: Atmosphere._ncMeta });
};
