import type express from 'express';
import Atmosphere from '~/Atmosphere';

export default function getHandler(
  defaultHandler: express.Handler,
  eeHandler: express.Handler,
): express.Handler {
  return async (...args) => {
    if (Atmosphere.isEE()) {
      return defaultHandler(...args);
    }
    return eeHandler(...args);
  };
}

export function getConditionalHandler<
  T extends (...args: any[]) => any,
  U extends (...args: any[]) => any,
>(
  defaultHandler: T,
  eeHandler: U,
): (
  ...args: Parameters<T> | Parameters<U>
) => Promise<ReturnType<T> | ReturnType<U>> {
  return async (...args: Parameters<T> | Parameters<U>) => {
    if (Atmosphere.isEE()) {
      return defaultHandler(...args);
    }
    return eeHandler(...args);
  };
}
