import type { CorsOptions } from 'cors';

const EXPOSED_HEADERS =
  'xc-db-response, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Policy, Retry-After';

export const getCorsOptions = (): CorsOptions => {
  const allowedOrigins = process.env.ATMOSPHERE_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    credentials: true,
    exposedHeaders: EXPOSED_HEADERS,
    origin(origin, callback) {
      if (!origin || !allowedOrigins?.length || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  };
};
