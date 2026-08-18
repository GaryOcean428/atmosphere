import { isValidURL } from 'atmosphere-sdk';
import Validator from 'validator';

export const customValidators = {
  isCurrency: Validator['isFloat'],
  isURL: (str: string, extraProps?: validator.IsURLOptions) => {
    return isValidURL(str, {
      ...(extraProps ?? {}),
      // TODO: respect ATMOSPHERE_DISABLE_SSRF_PROTECTION here
      require_tld:
        process.env.ATMOSPHERE_WEBHOOK_ALLOW_PRIVATE_NETWORK !== 'true' &&
        process.env.ATMOSPHERE_ALLOW_LOCAL_HOOKS !== 'true',
    });
  },
};
