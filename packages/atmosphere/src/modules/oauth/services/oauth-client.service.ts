import { Injectable } from '@nestjs/common';
import type { AtContext, AtRequest } from 'atmosphere-sdk';
import type {
  CreateOAuthClientDto,
  UpdateOAuthClientDto,
} from '~/modules/oauth/dto';
import {
  CreateOAuthClientSchema,
  UpdateOAuthClientSchema,
} from '~/modules/oauth/dto';
import { OAuthAuthorizationCode, OAuthClient, OAuthToken } from '~/models';
import { AtError } from '~/helpers/ncError';

@Injectable()
export class OauthClientService {
  async listClients(context: AtContext, req: AtRequest) {
    if (!req.user?.id) {
      AtError.get(context).badRequest('User not found');
    }
    const clients = await OAuthClient.list(req.user.id);

    return clients.map((client) => {
      return {
        ...client,
        client_secret: undefined,
      };
    });
  }

  async getClient(
    context: AtContext,
    {
      clientId,
      req,
    }: {
      clientId: string;
      req: AtRequest;
    },
  ) {
    if (!clientId || !req.user?.id) {
      AtError.get(context).badRequest('Client ID or user not found');
    }

    const client = await OAuthClient.getByClientId(clientId);

    if (!clientId || client.fk_user_id !== req.user.id) {
      AtError.get(context).notFound(clientId);
    }

    return client;
  }

  async createClient(
    context: AtContext,
    body: CreateOAuthClientDto,
    req: AtRequest,
  ) {
    const validatedBody = CreateOAuthClientSchema.safeParse(body);

    if (validatedBody.error) {
      AtError.get(context).zodError({
        message: 'Request body is invalid',
        errors: validatedBody.error,
      });
    }

    body.fk_user_id = req.user.id;

    return await OAuthClient.insert(body);
  }

  async updateClient(
    context: AtContext,
    {
      clientId,
      body,
      req,
    }: {
      clientId: string;
      body: UpdateOAuthClientDto;
      req: AtRequest;
    },
  ) {
    const validatedBody = UpdateOAuthClientSchema.safeParse(body);

    if (validatedBody.error) {
      AtError.get(context).zodError({
        message: 'Request body is invalid',
        errors: validatedBody.error,
      });
    }

    const client = await OAuthClient.getByClientId(clientId);

    if (!client || client.fk_user_id !== req.user.id) {
      AtError.get(context).apiClientNotFound(clientId);
    }

    return await OAuthClient.update(clientId, body);
  }

  async deleteClient(
    context: AtContext,
    { clientId, req }: { clientId: string; req: AtRequest },
  ) {
    await this.getClient(context, {
      clientId,
      req,
    });

    await OAuthToken.deleteAllByClient(clientId);

    await OAuthAuthorizationCode.deleteAllByClient(clientId);

    return await OAuthClient.delete(clientId);
  }

  async regenerateClientSecret(
    context: AtContext,
    { clientId, req }: { clientId: string; req: AtRequest },
  ) {
    const client = await this.getClient(context, {
      clientId,
      req,
    });

    if (!client || client.fk_user_id !== req.user.id) {
      AtError.get(context).apiClientNotFound(clientId);
    }

    if (client.client_type !== 'confidential') {
      AtError.get(context).badRequest(
        'Only confidential clients can have secrets',
      );
    }

    return await OAuthClient.regenerateSecret(clientId);
  }
}
