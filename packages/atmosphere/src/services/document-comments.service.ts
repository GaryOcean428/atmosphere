import { Injectable } from '@nestjs/common';
import type {
  DocumentCommentReqType,
  DocumentCommentUpdateReqType,
  UserType,
} from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';

@Injectable()
export class DocumentCommentsService {
  constructor(protected readonly appHooksService: AppHooksService) {}

  async commentCreate(
    _context: AtContext,
    _param: {
      body: DocumentCommentReqType;
      user: UserType;
      req: AtRequest;
    },
  ) {
    return null;
  }

  async commentUpdate(
    _context: AtContext,
    _param: {
      commentId: string;
      body: DocumentCommentUpdateReqType;
      user: UserType;
      req: AtRequest;
    },
  ) {
    return null;
  }

  async commentDelete(
    _context: AtContext,
    _param: {
      commentId: string;
      user: UserType;
      req: AtRequest;
    },
  ) {
    return true;
  }

  async commentList(
    _context: AtContext,
    _param: {
      fk_doc_id: string;
      req: AtRequest;
    },
  ) {
    return [];
  }

  async toggleReaction(
    _context: AtContext,
    _param: {
      commentId: string;
      reaction: string;
      user: UserType;
      req: AtRequest;
    },
  ) {
    return null;
  }
}
