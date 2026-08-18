import { Injectable } from '@nestjs/common';
import type { OPERATION_SCOPES } from '~/controllers/internal/operationScopes';
import type { AtContext, AtRequest } from 'atmosphere-sdk';
import type {
  InternalApiModule,
  InternalGETResponseType,
} from '~/utils/internal-type';
import { McpTokenService } from '~/services/mcp.service';

@Injectable()
export class McpGetOperations
  implements InternalApiModule<InternalGETResponseType>
{
  constructor(protected readonly mcpService: McpTokenService) {}
  operations = ['mcpList' as const, 'mcpGet' as const, 'mcpRootList' as const];
  httpMethod = 'GET' as const;

  async handle(
    context: AtContext,
    {
      req,
      operation,
    }: {
      workspaceId: string;
      baseId: string;
      operation: keyof typeof OPERATION_SCOPES;
      payload: any;
      req: AtRequest;
    },
  ): InternalGETResponseType {
    switch (operation) {
      case 'mcpList':
        return await this.mcpService.list(context, req);
      case 'mcpGet':
        return await this.mcpService.get(
          context,
          req.query.tokenId as string,
          req,
        );
      case 'mcpRootList':
        return await this.mcpService.listByUserId(context, req);
    }
  }
}
