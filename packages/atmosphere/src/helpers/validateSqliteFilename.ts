import path from 'path';
import { AtError } from '~/helpers/catchError';
import { getToolDir } from '~/utils/atm-config';

/**
 * Reject SQLite filenames that point at Atmosphere's own state (`atmosphere.db`,
 * `atm_data.db`, `atm_minimal_dbs/`). SQLite is not a supported production
 * database on cloud; self-host operators are trusted for everything else.
 */
export function validateSqliteFilename(rawFilename: unknown): string {
  if (typeof rawFilename !== 'string' || rawFilename.length === 0) {
    AtError.badRequest('SQLite filename is required');
  }
  if ((rawFilename as string).includes('\0')) {
    AtError.badRequest('Invalid SQLite filename');
  }
  const resolved = path.resolve(rawFilename as string);
  const toolDir = path.resolve(getToolDir());

  if (
    resolved === path.resolve(toolDir, 'atmosphere.db') ||
    resolved === path.resolve(toolDir, 'atm_data.db')
  ) {
    AtError.badRequest('Access to Atmosphere internal database is not allowed');
  }
  const minimalDbs = path.resolve(toolDir, 'atm_minimal_dbs');
  if (resolved === minimalDbs || resolved.startsWith(minimalDbs + path.sep)) {
    AtError.badRequest('Access to Atmosphere tenant databases is not allowed');
  }
  return resolved;
}

export function extractSqliteFilename(config: unknown): string | undefined {
  if (!config || typeof config !== 'object') return undefined;
  const c: any = config;
  return (
    c?.connection?.filename ?? c?.connection?.connection?.filename ?? undefined
  );
}

export function validateAndNormalizeSqliteConfig(
  config: unknown,
  subType?: string,
): void {
  if (subType && subType !== 'sqlite3') return;
  if (!config || typeof config !== 'object') return;
  const c: any = config;

  const inner = c?.connection?.connection;
  if (inner && typeof inner === 'object' && inner.filename != null) {
    inner.filename = validateSqliteFilename(inner.filename);
    return;
  }
  const conn = c?.connection;
  if (conn && typeof conn === 'object' && conn.filename != null) {
    conn.filename = validateSqliteFilename(conn.filename);
  }
}
