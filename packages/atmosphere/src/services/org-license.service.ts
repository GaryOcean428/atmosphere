import { Injectable } from '@nestjs/common';
import { ATMOSPHERE_LICENSE_KEY } from '../constants';
import { validatePayload } from '~/helpers';
import Atmosphere from '~/Atmosphere';
import { Store } from '~/models';

@Injectable()
export class OrgLicenseService {
  async licenseGet() {
    const license = await Store.get(ATMOSPHERE_LICENSE_KEY);

    return { key: license?.value };
  }

  async licenseSet(param: { key: string }) {
    validatePayload('swagger.json#/components/schemas/LicenseReq', param);

    await Store.saveOrUpdate({ value: param.key, key: ATMOSPHERE_LICENSE_KEY });
    await Atmosphere.loadEEState();
    return true;
  }

  async licenseStatus() {
    const license = await Store.get(ATMOSPHERE_LICENSE_KEY);
    return {
      ee: Atmosphere.isEE(),
      hasLicense: !!license?.value,
      status: Atmosphere.isEE() ? 'active' : 'none',
    };
  }

  async licenseRefresh(): Promise<{ success: boolean; status?: string }> {
    return { success: false, status: 'not_available' };
  }
}
