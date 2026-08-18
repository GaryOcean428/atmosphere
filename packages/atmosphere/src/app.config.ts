import type { AppConfig } from './interface/config';

const config: AppConfig = {
  throttler: {
    calc_execution_time: false,
  },
  basicAuth: {
    username: process.env.ATMOSPHERE_HTTP_BASIC_USER ?? 'defaultusername',
    password: process.env.ATMOSPHERE_HTTP_BASIC_PASS ?? 'defaultpassword',
  },
  auth: {
    emailPattern:
      (process.env.ATMOSPHERE_USER_ALLOWED_EMAIL_PATTERN ||
        process.env.ATMOSPHERE_AUTH_EMAIL_PATTERN) &&
      new RegExp(
        process.env.ATMOSPHERE_USER_ALLOWED_EMAIL_PATTERN ||
          process.env.ATMOSPHERE_AUTH_EMAIL_PATTERN,
      ),
    disableEmailAuth: !!process.env.ATMOSPHERE_DISABLE_EMAIL_AUTH,
  },
  mainSubDomain: process.env.ATMOSPHERE_MAIN_SUBDOMAIN ?? 'app',
  dashboardPath: process.env.ATMOSPHERE_DASHBOARD_URL ?? '/',
};

export default config;
