import { ncSiteUrl } from '~/utils/envs';

export const getAppUrl = () => {
  const siteUrl = ncSiteUrl || `http://localhost:${process.env.PORT || 8080}`;

  return `${siteUrl}${process.env.ATMOSPHERE_DASHBOARD_URL ?? '/'}`;
};
