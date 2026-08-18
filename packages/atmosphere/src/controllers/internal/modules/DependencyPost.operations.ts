import { Injectable } from '@nestjs/common';
import type { OPERATION_SCOPES } from '~/controllers/internal/operationScopes';
import type { AtContext, AtRequest } from 'atmosphere-sdk';
import type {
  InternalApiModule,
  InternalPOSTResponseType,
} from '~/utils/internal-type';
import { DependencyService } from '~/services/dependency.service';

@Injectable()
export class DependencyPostOperations
  implements InternalApiModule<InternalPOSTResponseType>
{
  constructor(protected readonly dependencyService: DependencyService) {}
  operations = ['checkDependency' as const];
  httpMethod = 'POST' as const;

  async handle(
    context: AtContext,
    {
      payload,
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
      case 'checkDependency':
        return await this.dependencyService.checkDependency(context, {
          entityType: payload.entityType,
          entityId: payload.entityId,
        });
    }
  }
}
