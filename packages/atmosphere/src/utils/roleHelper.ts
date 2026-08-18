import {
  extractProjectRolePower,
  extractWorkspaceRolePower,
  hasMinimumRoleAccess,
} from 'atmosphere-sdk';
import { AtError } from 'src/helpers/catchError';
import type { ProjectRoles } from 'atmosphere-sdk';

// Re-export getProjectRole from atmosphere-sdk to keep backward compatibility
export { getProjectRole } from 'atmosphere-sdk';

/**
 * Get the power of the project role of the user.
 * @param user - The user object.
 * @returns The power of the project role of the user.
 */
export function getProjectRolePower(user: any) {
  return extractProjectRolePower(user, () => {
    AtError.badRequest('Forbidden');
  });
}

/**
 * Get the power of the workspace role of the user.
 * @param user - The user object.
 * @returns The power of the workspace role of the user.
 */
export function getWorkspaceRolePower(user: any) {
  return extractWorkspaceRolePower(user, () => {
    AtError.badRequest('Forbidden');
  });
}

/**
 * Check if the user has the minimum role to access the resource.
 * @param user - The user object.
 * @param minimumRole - The minimum role to access the resource.
 * @returns True if the user has the minimum role, false otherwise.
 */
export function hasMinimumRole(user: any, minimumRole: ProjectRoles): boolean {
  return hasMinimumRoleAccess(user, minimumRole, () => {
    AtError.badRequest('Forbidden');
  });
}
