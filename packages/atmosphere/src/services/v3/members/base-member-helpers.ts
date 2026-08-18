import type { AtContext } from 'atmosphere-sdk';
import type { MetaService } from '~/meta/meta.service';
import { AtError } from '~/helpers/ncError';

export class BaseMemberHelpers {
  constructor() {}

  async getBaseMember(
    context: AtContext,
    _param: {
      baseId: string;
      isPrivateBase?: boolean;
    },
    _ncMeta?: MetaService,
  ): Promise<{
    individual_members: { base_members: any[]; workspace_members: any[] };
  }> {
    AtError.get(context).invalidRequestBody(
      'Accessing member management api is only available on paid plans. Please upgrade your workspace plan to enable this feature.',
    );
    return undefined;
  }
}
