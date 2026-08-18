import { Injectable } from '@nestjs/common';
import AtmosphereCache from '~/cache/AtmosphereCache';

@Injectable()
export class CachesService {
  async cacheGet() {
    return await AtmosphereCache.export();
  }

  async cacheDelete() {
    await AtmosphereCache.destroy();
    return true;
  }
}
