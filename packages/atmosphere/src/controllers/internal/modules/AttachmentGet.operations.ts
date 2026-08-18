import { Injectable } from '@nestjs/common';
import type { OPERATION_SCOPES } from '~/controllers/internal/operationScopes';
import type { AtContext, AtRequest } from 'atmosphere-sdk';
import type {
  InternalApiModule,
  InternalGETResponseType,
} from '~/utils/internal-type';
import { AttachmentsService } from '~/services/attachments.service';

@Injectable()
export class AttachmentGetOperations
  implements InternalApiModule<InternalGETResponseType>
{
  constructor(protected readonly attachmentsService: AttachmentsService) {}

  operations = ['attachmentDownload' as const];
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
      case 'attachmentDownload':
        return await this.attachmentsService.downloadAttachment(context, {
          modelId: req.query.modelId as string,
          columnId: req.query.columnId as string,
          rowId: req.query.rowId as string,
          urlOrPath: req.query.urlOrPath as string,
        });
    }
  }
}
