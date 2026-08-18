import type { UserType } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
declare module 'express-serve-static-core' {
  interface Request {
    context: AtContext;
    ncWorkspaceId?: string;
    // @Acl scope of the matched route; gates the default-workspace fallback
    ncAclScope?: string;
    ncBaseId?: string;
    user: UserType & {
      base_roles?: Record<string, boolean>;
      workspace_roles?: Record<string, boolean>;
      provider?: string;
      direct_teams?: { team_id: string; path: string }[];
    };
    ncSiteUrl: string;
    clientIp: string;
    dashboardUrl: string;
  }
}
