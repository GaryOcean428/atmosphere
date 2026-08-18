import { Injectable } from '@nestjs/common';
import { AppEvents, EventType, ViewTypes } from 'atmosphere-sdk';
import type {
  CalendarUpdateReqType,
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
import { CalendarView, Model, User, View } from '~/models';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { CacheScope } from '~/utils/globals';
import AtmosphereSocket from '~/socket/AtmosphereSocket';

@Injectable()
export class CalendarsService {
  constructor(protected readonly appHooksService: AppHooksService) {}

  async calendarViewGet(context: AtContext, param: { calendarViewId: string }) {
    return await CalendarView.get(context, param.calendarViewId);
  }

  @TraceCommand(OperationName.calendarViewCreate)
  async calendarViewCreate(
    context: AtContext,
    param: {
      tableId: string;
      calendar: ViewCreateReqType;
      user: UserType;
      req: AtRequest;
      ownedBy?: string;
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
      param.calendar,
    );

    if (context.schema_locked) {
      AtError.get(context).schemaLocked();
    }

    await assertPersonalViewAllowed(context, param.calendar.lock_type);

    const model = await Model.get(context, param.tableId, false, ncMeta);

    param.calendar.title = param.calendar.title?.trim();
    const existingView = await View.getByTitleOrId(
      context,
      {
        titleOrId: param.calendar.title,
        fk_model_id: param.tableId,
      },
      ncMeta,
    );
    if (existingView) {
      AtError.get(context).duplicateAlias({
        type: 'view',
        alias: param.calendar.title,
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
          ...param.calendar,
          fk_model_id: param.tableId,
          type: ViewTypes.CALENDAR,
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

    const view = await View.get(context, id, false, ncMeta);

    await AtmosphereCache.appendToList(
      context,
      CacheScope.VIEW,
      [view.fk_model_id],
      `${CacheScope.VIEW}:${id}`,
    );

    let owner = param.req.user;

    if (param.ownedBy) {
      owner = await User.get(param.ownedBy);
    }

    this.appHooksService.emit(AppEvents.CALENDAR_CREATE, {
      view: {
        ...view,
        ...param.calendar,
      },
      req: param.req,
      context,
      owner,
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

  @TraceCommand(OperationName.calendarViewUpdate)
  async calendarViewUpdate(
    context: AtContext,
    param: {
      calendarViewId: string;
      calendar: CalendarUpdateReqType;
      req: AtRequest;
      viewWebhookManager?: ViewWebhookManager;
    },
    ncMeta?: MetaService,
  ) {
    validatePayload(
      'swagger.json#/components/schemas/CalendarUpdateReq',
      param.calendar,
    );

    const view = await View.get(context, param.calendarViewId, false, ncMeta);

    if (!view) {
      AtError.viewNotFound(param.calendarViewId);
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

    const oldCalendarView = await CalendarView.get(
      context,
      param.calendarViewId,
      ncMeta,
    );

    await CalendarView.update(
      context,
      param.calendarViewId,
      param.calendar,
      ncMeta,
    );

    let owner = param.req.user;

    if (view.owned_by && view.owned_by !== param.req.user?.id) {
      owner = await User.get(view.owned_by, ncMeta);
    }

    this.appHooksService.emit(AppEvents.CALENDAR_UPDATE, {
      view: {
        ...view,
        ...param.calendar,
      },
      calendarView: param.calendar,
      oldCalendarView,
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
