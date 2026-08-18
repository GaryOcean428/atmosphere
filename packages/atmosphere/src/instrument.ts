import * as Sentry from '@sentry/node';
import { packageInfo } from '~/utils/packageVersion';

if (process.env.ATMOSPHERE_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.ATMOSPHERE_SENTRY_DSN,
    debug: false,
    environment: process.env.NODE_ENV,
    release: packageInfo.version,
  });
}
