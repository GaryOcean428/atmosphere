import { Injectable } from '@nestjs/common';
import { AppEvents, EventType } from 'atmosphere-sdk';
import { Base, Model } from '../models';
import type {
  CommentReqType,
  CommentUpdateReqType,
  UserType,
} from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { AtError } from '~/helpers/catchError';
import { validatePayload } from '~/helpers';
import { sanitizeCommentBody } from '~/helpers/sanitizeCommentBody';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';
import Comment from '~/models/Comment';
import { MailService } from '~/services/mail/mail.service';
import { MailEvent } from '~/interface/Mail';
import AtmosphereSocket from '~/socket/AtmosphereSocket';

@Injectable()
export class CommentsService {
  constructor(
    protected readonly appHooksService: AppHooksService,
    protected readonly mailService: MailService,
  ) {}

  async commentRow(
    context: AtContext,
    param: {
      body: CommentReqType;
      user: UserType;
      req: AtRequest;
      /** Interface-scoped callers stamp their surface — see `RowCommentEvent.source`. */
      source?: { interfaceId: string; pageId: string };
    },
  ) {
    validatePayload('swagger.json#/components/schemas/CommentReq', param.body);

    const sanitizedComment = sanitizeCommentBody(param.body.comment);

    const res = await Comment.insert(context, {
      ...param.body,
      comment: sanitizedComment,
      created_by: param.user?.id,
      created_by_email: param.user?.email,
    });

    const model = await Model.getByIdOrName(context, {
      id: param.body.fk_model_id,
    });

    const base = await Base.getByTitleOrId(context, model.base_id);

    await this.mailService.sendMail({
      mailEvent: MailEvent.COMMENT_CREATE,
      payload: {
        base,
        model,
        user: param.user,
        comment: res,
        rowId: param.body.row_id,
        req: param.req,
      },
    });

    this.appHooksService.emit(AppEvents.COMMENT_CREATE, {
      base,
      model,
      user: param.user,
      comment: res,
      rowId: param.body.row_id,
      req: param.req,
      context,
      ...(param.source ? { source: param.source } : {}),
    });

    AtmosphereSocket.broadcastEvent(
      context,
      {
        event: EventType.COMMENT_EVENT,
        payload: {
          action: 'add',
          payload: res,
          id: param.body.row_id,
        },
        scopes: [model.id],
      },
      context.socket_id,
    );

    return res;
  }

  async commentDelete(
    context: AtContext,
    param: {
      commentId: string;
      user: UserType;
      req: AtRequest;
    },
  ) {
    const comment = await Comment.get(context, param.commentId);

    if (comment.created_by !== param.user.id || comment.is_deleted) {
      AtError.get(context).unauthorized('Unauthorized access');
    }

    const res = await Comment.delete(context, param.commentId);

    const model = await Model.getByIdOrName(context, {
      id: comment.fk_model_id,
    });

    this.appHooksService.emit(AppEvents.COMMENT_DELETE, {
      base: await Base.getByTitleOrId(context, model.base_id),
      model: model,
      user: param.user,
      comment: comment,
      rowId: comment.row_id,
      req: param.req,
      context,
    });

    AtmosphereSocket.broadcastEvent(
      context,
      {
        event: EventType.COMMENT_EVENT,
        payload: {
          action: 'delete',
          payload: comment,
          id: comment.row_id,
        },
        scopes: [model.id],
      },
      context.socket_id,
    );

    return res;
  }

  async commentList(
    context: AtContext,
    param: {
      query: {
        row_id: string;
        fk_model_id: string;
      };
    },
  ) {
    return await Comment.list(context, param.query);
  }

  async commentsCount(
    context: AtContext,
    param: { fk_model_id: string; ids: string[] },
  ) {
    return await Comment.commentsCount(context, {
      fk_model_id: param.fk_model_id as string,
      ids: param.ids as string[],
    });
  }

  async commentUpdate(
    context: AtContext,
    param: {
      commentId: string;
      user: UserType;
      body: CommentUpdateReqType;
      req: AtRequest;
      /** Interface-scoped callers stamp their surface — see `RowCommentEvent.source`. */
      source?: { interfaceId: string; pageId: string };
    },
  ) {
    validatePayload(
      'swagger.json#/components/schemas/CommentUpdateReq',
      param.body,
    );

    const comment = await Comment.get(context, param.commentId);

    if (comment.created_by !== param.user.id || comment.is_deleted) {
      AtError.get(context).unauthorized('Unauthorized access');
    }

    const sanitizedComment = sanitizeCommentBody(param.body.comment);

    const res = await Comment.update(context, param.commentId, {
      comment: sanitizedComment,
      // only overwrite attachments when explicitly provided, so a text-only
      // edit doesn't wipe existing files
      ...(param.body.attachments !== undefined
        ? { attachments: param.body.attachments }
        : {}),
      ...(param.body.meta !== undefined ? { meta: param.body.meta } : {}),
    });

    const model = await Model.getByIdOrName(context, {
      id: comment.fk_model_id,
    });

    const base = await Base.getByTitleOrId(context, model.base_id);

    await this.mailService.sendMail({
      mailEvent: MailEvent.COMMENT_CREATE,
      payload: {
        base,
        model,
        user: param.user,
        comment: res,
        rowId: res.row_id,
        req: param.req,
      },
    });

    this.appHooksService.emit(AppEvents.COMMENT_UPDATE, {
      base,
      model,
      user: param.user,
      comment: {
        ...comment,
        comment: param.body.comment,
      },
      rowId: comment.row_id,
      req: param.req,
      context,
      ...(param.source ? { source: param.source } : {}),
    });

    AtmosphereSocket.broadcastEvent(
      context,
      {
        event: EventType.COMMENT_EVENT,
        payload: {
          action: 'update',
          payload: res,
          id: comment.row_id,
        },
        scopes: [model.id],
      },
      context.socket_id,
    );

    return res;
  }
}
