import { Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import type { MCPTokenType } from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { AtError } from '~/helpers/catchError';
import { Base, MCPToken, Workspace } from '~/models';
import { processConcurrently } from '~/utils/dataUtils';
import { RootScopes } from '~/utils/globals';

@Injectable()
export class McpTokenService {
  protected logger = new Logger(McpTokenService.name);

  async list(context: AtContext, req: AtRequest) {
    const userId = req.user.id;
    return await MCPToken.list(context, userId);
  }

  async create(
    context: AtContext,
    payload: Partial<MCPTokenType>,
    req: AtRequest,
  ) {
    // Set required fields
    payload.fk_user_id = req.user.id;
    payload.fk_workspace_id = context.workspace_id;
    payload.base_id = context.base_id;

    payload.title = payload.title?.trim();

    const mcp = await MCPToken.insert(context, payload);

    return {
      ...mcp,
      base: await Base.get(context, mcp.base_id),
      workspace: await Workspace.get(mcp.fk_workspace_id),
    };
  }

  async regenerateToken(
    context: AtContext,
    tokenId: string,
    payload: Pick<MCPTokenType, 'token'>,
    req: AtRequest,
  ) {
    const token = await MCPToken.get(context, tokenId);
    if (!token) {
      AtError.get(context).notFound('MCP token not found');
    }

    if (token.fk_user_id !== req.user.id) {
      AtError.get(context).forbidden('Not authorized to modify this token');
    }

    payload.token = nanoid(32);

    const mcp = await MCPToken.update(context, tokenId, payload);

    return {
      ...mcp,
      base: await Base.get(context, mcp.base_id),
      workspace: await Workspace.get(mcp.fk_workspace_id),
    };
  }

  async delete(context: AtContext, tokenId: string, req: AtRequest) {
    const token = await MCPToken.get(context, tokenId);

    if (!token) {
      AtError.get(context).notFound('MCP token not found');
    }

    if (token.fk_user_id !== req.user.id) {
      AtError.get(context).forbidden('Not authorized to delete this token');
    }

    const success = await MCPToken.delete(context, tokenId);
    if (!success) {
      AtError.internalServerError('Failed to delete MCP token');
    }

    return true;
  }

  async get(context: AtContext, tokenId: string, req: AtRequest) {
    const token = await MCPToken.get(context, tokenId);
    if (!token) {
      AtError.get(context).notFound('MCP token not found');
    }

    if (token.fk_user_id !== req.user.id) {
      AtError.get(context).forbidden('Not authorized to access this token');
    }

    return {
      ...token,
      base: await Base.get(context, token.base_id),
      workspace: await Workspace.get(token.fk_workspace_id),
    };
  }

  async listByUserId(context: AtContext, req: AtRequest) {
    const userId = req.user.id;
    const tokens = await MCPToken.listByUser(context, userId);

    const workspaceIds = new Set<string>();
    const baseIds = new Set<string>();

    tokens.forEach((token: MCPToken) => {
      if (token.fk_workspace_id) workspaceIds.add(token.fk_workspace_id);
      if (token.base_id) baseIds.add(token.base_id);
    });

    const workspaceMap = new Map<string, Workspace>();
    const baseMap = new Map<string, Base>();

    await processConcurrently(
      [...Array.from(workspaceIds), ...Array.from(baseIds)],
      async (id) => {
        try {
          if (workspaceIds.has(id)) {
            const workspace = await Workspace.get(id);
            if (workspace?.title) {
              workspaceMap.set(id, workspace);
            }
          } else {
            const base = await Base.get(
              {
                workspace_id: RootScopes.BYPASS,
                base_id: RootScopes.BYPASS,
              },
              id,
            );
            if (base?.title) {
              baseMap.set(id, base);
            }
          }
        } catch (e) {
          this.logger.error('Failed to fetch base/workspace', e);
        }
      },
      5,
    );

    return tokens.map((token: any) => ({
      ...token,
      workspace: token.fk_workspace_id
        ? workspaceMap.get(token.fk_workspace_id) || null
        : null,
      base: token.base_id ? baseMap.get(token.base_id) || null : null,
    }));
  }
}
