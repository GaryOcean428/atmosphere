import { Injectable } from '@nestjs/common';
import type { OPERATION_SCOPES } from '~/controllers/internal/operationScopes';
import type { AtContext, AtRequest } from 'atmosphere-sdk';
import type {
  InternalApiModule,
  InternalPOSTResponseType,
} from '~/utils/internal-type';
import { McpTokenService } from '~/services/mcp.service';

@Injectable()
export class McpPostOperations
  implements InternalApiModule<InternalPOSTResponseType>
{
  constructor(protected readonly mcpService: McpTokenService) {}
  operations = [
    'mcpCreate' as const,
    'mcpUpdate' as const,
    'mcpDelete' as const,
  ];
  httpMethod = 'POST' as const;

  async handle(
    context: AtContext,
    {
      payload,
      req,
      operation,
    }: {
      workspaceId: string;
      baseId: string;
      operation: keyof typeof OPERATION_SCOPES;
      payload: any;
      req: AtRequest;
    },
  ): InternalPOSTResponseType {
    switch (operation) {
      case 'mcpCreate':
        return await this.mcpService.create(context, payload, req);
      case 'mcpUpdate':
        return await this.mcpService.regenerateToken(
          context,
          payload.tokenId,
          payload,
          req,
        );
      case 'mcpDelete':
        return await this.mcpService.delete(context, payload.tokenId, req);
    }
  }
}
