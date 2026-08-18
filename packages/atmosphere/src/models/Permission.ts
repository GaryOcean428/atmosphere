import type {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  PermissionRole,
  ProjectRoles,
  WorkspaceUserRoles,
} from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';

export default class Permission {
  id: string;
  fk_workspace_id: string;
  base_id: string;
  entity: PermissionEntity;
  entity_id: string;
  permission: PermissionKey;
  created_by: string;
  enforce_for_form: boolean;
  enforce_for_automation: boolean;
  granted_type: PermissionGrantedType;
  granted_role: PermissionRole;

  subjects?: {
    type: 'user' | 'team';
    id: string;
  }[];

  constructor(permission: Permission) {
    Object.assign(this, permission);
  }
  public static async list(
    context: AtContext,
    baseId: string,
    _ncMeta = Atmosphere.ncMeta,
  ): Promise<Permission[]> {
    return [];
  }

  // placeholder for actual permission check logic
  static async isAllowed(
    _context: AtContext,
    _permissionObj: Permission,
    _user: {
      id: string;
      role: ProjectRoles | WorkspaceUserRoles;
    },
  ): Promise<boolean> {
    return true;
  }
}
