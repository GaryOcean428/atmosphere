import type { AtRequest } from '~/interface/config';

/**
 * CE stub — fine-grained API tokens are an EE-only feature.
 * Always returns `null` (no filtering) in CE builds.
 * The EE build overrides this with actual scope-based filtering.
 */
export interface PatResourceFilter {
  baseIds: string[];
  workspaceIds: string[];
}

export async function getPatResourceFilter(
  _req?: AtRequest,
): Promise<PatResourceFilter | null> {
  return null;
}
