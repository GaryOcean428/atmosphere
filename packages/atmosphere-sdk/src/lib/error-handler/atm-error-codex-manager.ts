import { AtBaseErrorv2, AtErrorArgs } from '~/lib/error/atm-base.error';
import { AtErrorType } from '~/lib/globals';
import { presetErrorCodexMap } from '~/lib/error-handler/preset-error-codex-map';

export class AtErrorCodexManager {
  constructor() {
    this.setErrorCodexes(presetErrorCodexMap);
  }

  errorCodexMap: Partial<
    Record<
      AtErrorType,
      {
        message: string | ((...params: string[]) => string);
        code: number;
        error_code?: AtErrorType;
      }
    >
  > = {};

  setErrorCodex(
    errorType: AtErrorType,
    handler: {
      message: string | ((...params: string[]) => string);
      code: number;
      error_code?: AtErrorType;
    }
  ) {
    this.errorCodexMap[errorType] = handler;
  }

  setErrorCodexes(
    handlers: Partial<
      Record<
        AtErrorType,
        {
          message: string | ((...params: string[]) => string);
          code: number;
          error_code?: AtErrorType;
        }
      >
    >
  ) {
    this.errorCodexMap = { ...this.errorCodexMap, ...handlers };
  }

  generateError(error: AtErrorType, args?: AtErrorArgs) {
    const errorHelper = this.errorCodexMap[error];
    const { params, customMessage, details } = args || {};

    if (!errorHelper) {
      return {
        message: 'An error occurred',
        code: 500,
        details: details,
      };
    }

    let message: string;
    const messageHelper = customMessage || errorHelper.message;

    if (typeof messageHelper === 'function') {
      message = messageHelper(...(Array.isArray(params) ? params : [params]));
    } else {
      message = messageHelper;
    }

    return new AtBaseErrorv2(message, errorHelper.code, error, {
      details: details,
    });
  }
}
