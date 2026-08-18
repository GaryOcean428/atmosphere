import { InternalApi } from './lib/Api.ts';
import type { InternalAPI, AtmosphereOptions } from './types';
import { Workspace } from './workspace';

class Atmosphere {
  private static _endPointURL = 'https://app.atmosphere.dev';
  private static _apiKey: string;
  private readonly internalAPI: InternalAPI;

  constructor(
    options: AtmosphereOptions = {
      endPointURL: 'https://app.atmosphere.dev',
    },
  ) {
    const endPointURL = options.endPointURL || Atmosphere._endPointURL;
    const apiKey = options.apiKey || Atmosphere._apiKey;

    if (!apiKey) {
      throw new Error(
        'apiKey is required. Provide it in the constructor options or use Atmosphere.configure().',
      );
    }

    this.internalAPI = new InternalApi({
      baseURL: endPointURL,
      headers: {
        ['xc-token']: apiKey,
      },
    }).api;
  }

  static configure(options: AtmosphereOptions): void {
    if (!options) {
      throw new Error(
        'options is required. Provide it in the constructor options or use Atmosphere.configure().',
      );
    }

    if (!options.apiKey) {
      throw new Error(
        'apiKey is required. Provide it in the constructor options or use Atmosphere.configure().',
      );
    }

    Atmosphere._endPointURL = options.endPointURL || Atmosphere._endPointURL;
    Atmosphere._apiKey = options.apiKey;
  }

  workspace(id: string): Workspace {
    return new Workspace(this.internalAPI, id);
  }
}
