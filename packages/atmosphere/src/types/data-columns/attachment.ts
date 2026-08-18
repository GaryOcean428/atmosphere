import type { AttachmentFilePathConstructed } from '~/helpers/attachmentHelpers';
import type { AtContext, AtRequest, PublicAttachmentScope } from 'atmosphere-sdk';

// Attachment data types for v3 API
export interface DataAttachmentRequestUrl {
  url: string;
}

export interface DataAttachmentRequestId {
  id: string;
}

export type DataAttachmentRequest =
  | DataAttachmentRequestUrl
  | DataAttachmentRequestId;

export interface AttachmentUrlUploadParam {
  context: AtContext;
  scope?: PublicAttachmentScope;
  req?: Partial<AtRequest>;
  modelId: string;
  column: {
    id: string;
    title: string;
    column_name: string;
  };
  recordId: string;
  attachments: (
    | {
        id?: string;
        url: string;
      }
    | ({
        id?: string;
        url: string;
        status?: string;
        type?: string;
      } & AttachmentFilePathConstructed)
  )[];
}

export interface AttachmentBase64UploadParam {
  context: AtContext;
  scope?: PublicAttachmentScope;
  modelId: string;
  columnId: string;
  recordId: string;
  req?: Partial<AtRequest>;
  attachment: {
    contentType: string;
    file: string; // base64-encoded-file-content
    filename: string;
  };
}
