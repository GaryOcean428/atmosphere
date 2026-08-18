import { Injectable } from '@nestjs/common';
import { AppEvents, EventType, ViewTypes } from 'atmosphere-sdk';
import type {
  GalleryUpdateReqType,
  UserType,
  ViewCreateReqType,
} from 'atmosphere-sdk';
import type { AtRequest } from '~/interface/config';
import { AtContext } from '~/interface/config';
import { MetaService } from '~/meta/meta.service';
import {
  type ViewWebhookManager,
  ViewWebhookManagerBuilder,
} from '~/utils/view-webhook-manager';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';
import { validatePayload } from '~/helpers';
import { assertPersonalViewAllowed } from '~/helpers/checkPersonalViewFeature';
import { assertNotSandbox } from '~/helpers/sandboxGuards';
import { AtError } from '~/helpers/catchError';
import { TraceCommand } from '~/decorators/trace-command.decorator';
import { OperationName } from '~/command-registry/op-names';
import { GalleryView, Model, User, View } from '~/models';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { CacheScope } from '~/utils/globals';
import AtmosphereSocket from '~/socket/AtmosphereSocket';

@Injectable()
export class GalleriesService {
  constructor(protected readonly appHooksService: AppHooksService) {}

  async galleryViewGet(context: AtContext, param: { galleryViewId: string }) {
    return await GalleryView.get(context, param.galleryViewId);
  }

  @TraceCommand(OperationName.galleryViewCreate)
  async galleryViewCreate(
    context: AtContext,
    param: {
      tableId: string;
      gallery: ViewCreateReqType;
      user: UserType;
      ownedBy?: string;
      req: AtRequest;
      viewWebhookManager?: ViewWebhookManager;
    },
    ncMeta?: MetaService,
  ) {
    if (param?.ownedBy) {
      await assertNotSandbox(
        context,
        'Personal views cannot be created in a sandbox. Create them on the production base.',
      );
    }

    validatePayload(
      'swagger.json#/components/schemas/ViewCreateReq',
      param.gallery,
    );

    if (context.schema_locked) {
      AtError.get(context).schemaLocked();
    }

    await assertPersonalViewAllowed(context, param.gallery.lock_type);

    const model = await Model.get(context, param.tableId, false, ncMeta);

    param.gallery.title = param.gallery.title?.trim();
    const existingView = await View.getByTitleOrId(
      context,
      {
        titleOrId: param.gallery.title,
        fk_model_id: param.tableId,
      },
      ncMeta,
    );
    if (existingView) {
      AtError.get(context).duplicateAlias({
        type: 'view',
        alias: param.gallery.title,
        label: 'title',
        base: context.base_id,
        additionalTrace: {
          table: param.tableId,
        },
      });
    }
    const viewWebhookManager =
      param.viewWebhookManager ??
      (
        await new ViewWebhookManagerBuilder(context, ncMeta).withModelId(
          param.tableId,
        )
      ).forCreate();
    const { id } = await View.insertMetaOnly(
      context,
      {
        view: {
          ...param.gallery,
          // todo: sanitize
          fk_model_id: param.tableId,
          type: ViewTypes.GALLERY,
          base_id: model.base_id,
          source_id: model.source_id,
          created_by: param.user?.id,
          owned_by: param.ownedBy || param.user?.id,
        },
        model,
        req: param.req,
      },
      ncMeta,
    );

    // populate  cache and add to list since the list cache already exist
    const view = await View.get(context, id, false, ncMeta);
    await AtmosphereCache.appendToList(
      context,
      CacheScope.VIEW,
      [view.fk_model_id],
      `${CacheScope.VIEW}:${id}`,
    );

    let owner = param.req.user;

    if (param.ownedBy) {
      owner = await User.get(param.ownedBy, ncMeta);
    }

    this.appHooksService.emit(AppEvents.GALLERY_CREATE, {
      view: {
        ...param.gallery,
        ...view,
      },
      req: param.req,
      owner,
      context,
    });

    await view.getView(context);

    AtmosphereSocket.broadcastEvent(
      context,
      {
        event: EventType.META_EVENT,
        payload: {
          action: 'view_create',
          payload: view,
        },
      },
      context.socket_id,
    );

    if (!param.viewWebhookManager) {
      (await viewWebhookManager.withNewViewId(view.id)).emit();
    }

    return view;
  }

  @TraceCommand(OperationName.galleryViewUpdate)
  async galleryViewUpdate(
    context: AtContext,
    param: {
      galleryViewId: string;
      gallery: GalleryUpdateReqType;
      req: AtRequest;
      viewWebhookManager?: ViewWebhookManager;
    },
    ncMeta?: MetaService,
  ) {
    validatePayload(
      'swagger.json#/components/schemas/GalleryUpdateReq',
      param.gallery,
    );

    const view = await View.get(context, param.galleryViewId, false, ncMeta);

    if (!view) {
      AtError.get(context).viewNotFound(param.galleryViewId);
    }

    const viewWebhookManager =
      param.viewWebhookManager ??
      (
        await (
          await new ViewWebhookManagerBuilder(context, ncMeta).withModelId(
            view.fk_model_id,
          )
        ).withViewId(view.id)
      ).forUpdate();

    const oldGalleryView = await GalleryView.get(
      context,
      param.galleryViewId,
      ncMeta,
    );

    await GalleryView.update(
      context,
      param.galleryViewId,
      param.gallery,
      ncMeta,
    );

    let owner = param.req.user;

    if (view.owned_by && view.owned_by !== param.req.user?.id) {
      owner = await User.get(view.owned_by, ncMeta);
    }

    this.appHooksService.emit(AppEvents.GALLERY_UPDATE, {
      view,
      galleryView: param.gallery,
      oldGalleryView,
      oldView: view,
      req: param.req,
      context,
      owner,
    });

    await view.getView(context);

    // Strip the stored bcrypt password hash from every outbound payload.
    const safeView = View.maskPasswordForResponse(view);

    AtmosphereSocket.broadcastEvent(
      context,
      {
        event: EventType.META_EVENT,
        payload: {
          action: 'view_update',
          payload: safeView,
        },
      },
      context.socket_id,
    );
    if (!param.viewWebhookManager) {
      (await viewWebhookManager.withNewViewId(view.id)).emit();
    }
    return safeView;
  }
}
