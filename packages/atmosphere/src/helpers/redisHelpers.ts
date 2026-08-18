export enum ATMOSPHERE_REDIS_TYPE {
  CACHE = 'CACHE',
  JOB = 'JOB',
  THROTTLER = 'THROTTLER',
}

export const ATMOSPHERE_REDIS_TTL = +process.env.ATMOSPHERE_REDIS_TTL || 60 * 60 * 24 * 3; // 3 days
export const ATMOSPHERE_REDIS_GRACE_TTL =
  +process.env.ATMOSPHERE_REDIS_GRACE_TTL || 60 * 60 * 24 * 1; // 1 day

export const getRedisURL = (type?: ATMOSPHERE_REDIS_TYPE) => {
  switch (type) {
    case ATMOSPHERE_REDIS_TYPE.CACHE:
      return process.env.ATMOSPHERE_CACHE_REDIS_URL || process.env.ATMOSPHERE_REDIS_URL;
    case ATMOSPHERE_REDIS_TYPE.JOB:
      return (
        process.env.ATMOSPHERE_REDIS_JOB_URL ||
        process.env.ATMOSPHERE_JOBS_REDIS_URL ||
        process.env.ATMOSPHERE_REDIS_URL
      );
    case ATMOSPHERE_REDIS_TYPE.THROTTLER:
      return (
        process.env.ATMOSPHERE_RATE_LIMIT_REDIS_URL ||
        process.env.ATMOSPHERE_THROTTLER_REDIS ||
        process.env.ATMOSPHERE_REDIS_URL
      );
    default:
      return process.env.ATMOSPHERE_CACHE_REDIS_URL || process.env.ATMOSPHERE_REDIS_URL;
  }
};
