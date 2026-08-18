import type { AtContext } from 'atmosphere-sdk';
import Atmosphere from '~/Atmosphere';

export async function getBaseSchema(
  _context: AtContext,
  _ncMeta = Atmosphere.ncMeta,
) {
  // Not Implemented
}

export async function cleanBaseSchemaCacheForBase(_baseId: string) {
  // Not Implemented
}

export async function cleanBaseSchemaCacheForWorkspace(_workspaceId: string) {
  // Not Implemented
}
