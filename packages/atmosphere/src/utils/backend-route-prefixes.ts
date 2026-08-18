// Backend route prefixes — bare paths for Express app.use() prefix matching.
// Used by app.module.ts forRoutes() which registers via Express app.use(),
// where '/api' matches '/api', '/api/', '/api/v1/...' etc.
export const backendRoutePrefixes = [
  '/api',
  '/sso',
  '/auth',
  '/download',
  '/dl',
  '/dltemp',
  '/p',
  '/data',
  '/internal',
  '/jobs',
  '/.well-known',
];

// path-to-regexp v3 (used by NestJS .exclude()): '/*' is a literal asterisk,
// NOT a wildcard. Use '/:path*' for prefix matching across sub-paths.
export const backendRouteExcludePatterns = [
  ...backendRoutePrefixes.map((p) => p + '/:path*'),
  // /atm is a frontend route prefix (/atm/{baseId}, /atm/integrations, /atm/feed, etc.)
  // but old-datas controller has API endpoints at /atm/:baseId/api/v1/* — exclude only those.
  '/atm/:baseId/api/v1/:path*',
];
