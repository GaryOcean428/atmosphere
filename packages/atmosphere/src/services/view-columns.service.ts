import { Injectable } from '@nestjs/common';
import {
  APIContext,
  AppEvents,
  EventType,
  AtBaseError,
  ViewTypes,
} from 'atmosphere-sdk';
import { Logger } from '@nestjs/common';
import GridViewColumn from '../models/GridViewColumn';
import GalleryViewColumn from '../models/GalleryViewColumn';
import KanbanViewColumn from '../models/KanbanViewColumn';
import MapViewColumn from '../models/MapViewColumn';
import FormViewColumn from '../models/FormViewColumn';
import type {
  CalendarColumnReqType,
  FormColumnReqType,
  GalleryColumnReqType,
  GridColumnReqType,
  KanbanColumnReqType,
  ViewColumnReqType,
  ViewColumnUpdateReqType,
} from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import type { MetaService } from '~/meta/meta.service';
import type { ViewWebhookManager } from '~/utils/view-webhook-manager';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';
import { validatePayload } from '~/helpers';
import {
  CalendarViewColumn,
  Column,
  GanttViewColumn,
  TimelineViewColumn,
  View,
} from '~/models';
import { AtError } from '~/helpers/catchError';
import Atmosphere from '~/Atmosphere';
import AtmosphereSocket from '~/socket/AtmosphereSocket';
import { ViewWebhookManagerBuilder } from '~/utils/view-webhook-manager';

@Injectable()
export class ViewColumnsService {
  private logger = new Logger(ViewColumnsService.name);
  constructor(protected appHooksService: AppHooksService) {}

  async columnList(
    context: AtContext,
    param: { viewId: string },
    ncMeta?: MetaService,
  ) {
    return await View.getColumns(context, param.viewId, ncMeta);
  }

  async columnAdd(
    context: AtContext,
    param: {
      viewId: string;
      column: ViewColumnReqType;
      req: AtRequest;
      viewWebhookManager?: ViewWebhookManager;
    },
    ncMeta?: MetaService,
  ) {
    validatePayload(
      'swagger.json#/components/schemas/ViewColumnReq',
      param.column,
    );

    const view = await View.get(context, param.viewId, false, ncMeta);

    let viewWebhookManager: ViewWebhookManager;
    if (!param.viewWebhookManager) {
      viewWebhookManager =
        param.viewWebhookManager ??
        (
          await (
            await new ViewWebhookManagerBuilder(context, ncMeta).withModelId(
              view.fk_model_id,
            )
          ).withViewId(view.id)
        ).forUpdate();
    }

    const viewColumn = await View.insertOrUpdateColumn(
      context,
      param.viewId,
      param.column.fk_column_id,
      {
        order: param.column.order,
        show: param.column.show,
      },
    );

    const column = await Column.get(
      context,
      { colId: param.column.fk_column_id },
      ncMeta,
    );

    if (view && column) {
      this.appHooksService.emit(AppEvents.VIEW_COLUMN_CREATE, {
        viewColumn,
        view,
        column,
        req: param.req,
        context,
      });
    }

    if (viewWebhookManager) {
      (
        await viewWebhookManager.withNewViewId(viewWebhookManager.getViewId())
      ).emit();
    }

    return viewColumn;
  }

  async columnUpdate(
    context: AtContext,
    param: {
      viewId: string;
      columnId: string;
      column: ViewColumnUpdateReqType;
      req: AtRequest;
      internal?: boolean;
      viewWebhookManager?: ViewWebhookManager;
    },
    ncMeta?: MetaService,
  ) {
    if (context.schema_locked) {
      AtError.get(context).schemaLocked();
    }

    validatePayload(
      'swagger.json#/components/schemas/ViewColumnUpdateReq',
      param.column,
    );

    const view = await View.get(context, param.viewId, false, ncMeta);

    if (!view) {
      AtError.get(context).viewNotFound(param.viewId);
    }

    const oldViewColumn = await View.getColumn(
      context,
      param.viewId,
      param.columnId,
      ncMeta,
    );

    if (!oldViewColumn) {
      AtError.get(context).fieldNotFound(param.columnId);
    }

    const column = await Column.get(
      context,
      {
        colId: oldViewColumn.fk_column_id,
      },
      ncMeta,
    );

    let viewWebhookManager: ViewWebhookManager;
    if (!param.viewWebhookManager) {
      viewWebhookManager =
        param.viewWebhookManager ??
        (
          await (
            await new ViewWebhookManagerBuilder(context, ncMeta).withModelId(
              view.fk_model_id,
            )
          ).withViewId(view.id)
        ).forUpdate();
    }

    const result = await View.updateColumn(
      context,
      param.viewId,
      param.columnId,
      param.column,
      ncMeta,
    );

    const viewColumn = await View.getColumn(
      context,
      param.viewId,
      param.columnId,
      ncMeta,
    );

    this.appHooksService.emit(AppEvents.VIEW_COLUMN_UPDATE, {
      viewColumn,
      oldViewColumn,
      view,
      column,
      internal: param.internal,
      req: param.req,
      context,
    });

    AtmosphereSocket.broadcastEvent(
      context,
      {
        event: EventType.META_EVENT,
        payload: {
          action: 'view_column_update',
          payload: {
            ...oldViewColumn,
            ...viewColumn,
          },
        },
      },
      context.socket_id,
    );

    if (viewWebhookManager) {
      (
        await viewWebhookManager.withNewViewId(viewWebhookManager.getViewId())
      ).emit();
    }

    return result;
  }

  async columnsUpdate(
    context: AtContext,
    param: {
      viewId: string;
      columns:
        | GridColumnReqType
        | GalleryColumnReqType
        | KanbanColumnReqType
        | FormColumnReqType
        | CalendarColumnReqType[]
        | Record<
            APIContext.VIEW_COLUMNS,
            Record<
              string,
              | GridColumnReqType
              | GalleryColumnReqType
              | KanbanColumnReqType
              | FormColumnReqType
              | CalendarColumnReqType
            >
          >;
      req: any;
      viewWebhookManager?: ViewWebhookManager;
    },
  ) {
    const { viewId } = param;

    const columns = Array.isArray(param.columns)
      ? param.columns
      : param.columns?.[APIContext.VIEW_COLUMNS];

    if (!columns) {
      AtError.get(context).badRequest('Invalid request - fields not found');
    }

    const view = await View.get(context, viewId);

    if (!view) {
      AtError.get(context).viewNotFound('View not found');
    }

    // Build the webhook manager before opening the transaction — its async
    // builder chain can throw on transient DB errors, which would otherwise
    // leak an open trx between startTransaction and the try block.
    let viewWebhookManager: ViewWebhookManager;
    if (!param.viewWebhookManager) {
      viewWebhookManager =
        param.viewWebhookManager ??
        (
          await (
            await new ViewWebhookManagerBuilder(context).withModelId(
              view.fk_model_id,
            )
          ).withViewId(view.id)
        ).forUpdate();
    }

    const updateOrInsertOptions: Promise<any>[] = [];

    let result: any;
    const ncMeta = await Atmosphere.ncMeta.startTransaction();

    try {
      const table = View.extractViewColumnsTableName(view);

      // iterate over view columns and update/insert accordingly
      for (const [indexOrId, column] of Object.entries(columns)) {
        const columnId = Array.isArray(param.columns)
          ? column['id']
          : indexOrId;

        const existingCol = await ncMeta.metaGet2(
          context.workspace_id,
          context.base_id,
          table,
          {
            fk_view_id: viewId,
            fk_column_id: columnId,
          },
        );

        switch (view.type) {
          case ViewTypes.GRID:
            validatePayload(
              'swagger.json#/components/schemas/GridColumnReq',
              column,
            );
            if (existingCol) {
              updateOrInsertOptions.push(
                GridViewColumn.update(context, existingCol.id, column, ncMeta),
              );
            } else {
              updateOrInsertOptions.push(
                GridViewColumn.insert(
                  context,
                  {
                    ...(column as GridColumnReqType),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
          case ViewTypes.GALLERY:
            validatePayload(
              'swagger.json#/components/schemas/GalleryColumnReq',
              column,
            );
            if (existingCol) {
              updateOrInsertOptions.push(
                GalleryViewColumn.update(
                  context,
                  existingCol.id,
                  column,
                  ncMeta,
                ),
              );
            } else {
              updateOrInsertOptions.push(
                GalleryViewColumn.insert(
                  context,
                  {
                    ...(column as GalleryColumnReqType),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
          case ViewTypes.KANBAN:
            validatePayload(
              'swagger.json#/components/schemas/KanbanColumnReq',
              column,
            );
            if (existingCol) {
              updateOrInsertOptions.push(
                KanbanViewColumn.update(
                  context,
                  existingCol.id,
                  column,
                  ncMeta,
                ),
              );
            } else {
              updateOrInsertOptions.push(
                KanbanViewColumn.insert(
                  context,
                  {
                    ...(column as KanbanColumnReqType),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
          case ViewTypes.MAP:
            validatePayload(
              'swagger.json#/components/schemas/MapColumn',
              column,
            );
            if (existingCol) {
              updateOrInsertOptions.push(
                MapViewColumn.update(context, existingCol.id, column, ncMeta),
              );
            } else {
              updateOrInsertOptions.push(
                MapViewColumn.insert(
                  context,
                  {
                    ...(column as MapViewColumn),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
          case ViewTypes.FORM:
            validatePayload(
              'swagger.json#/components/schemas/FormColumnReq',
              column,
            );
            if (existingCol) {
              updateOrInsertOptions.push(
                FormViewColumn.update(context, existingCol.id, column, ncMeta),
              );
            } else {
              updateOrInsertOptions.push(
                FormViewColumn.insert(
                  context,
                  {
                    ...(column as FormColumnReqType),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
          case ViewTypes.CALENDAR:
            validatePayload(
              'swagger.json#/components/schemas/CalendarColumnReq',
              column,
            );
            if (existingCol) {
              updateOrInsertOptions.push(
                CalendarViewColumn.update(
                  context,
                  existingCol.id,
                  column,
                  ncMeta,
                ),
              );
            } else {
              updateOrInsertOptions.push(
                CalendarViewColumn.insert(
                  context,
                  {
                    ...(column as CalendarColumnReqType),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
          case ViewTypes.TIMELINE:
            // Timeline shares the Calendar-style column model (show/order +
            // bold/italic/underline). Bulk import via columnsUpdate needs
            // to reach the right column row; without this case, B/I/U +
            // visibility silently get dropped on table duplicate.
            if (existingCol) {
              updateOrInsertOptions.push(
                TimelineViewColumn.update(
                  context,
                  existingCol.id,
                  column,
                  ncMeta,
                ),
              );
            } else {
              updateOrInsertOptions.push(
                TimelineViewColumn.insert(
                  context,
                  {
                    ...(column as any),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
          case ViewTypes.GANTT:
            // Gantt mirrors Timeline — same column model shape. Same
            // motivation: keep duplicate carrying B/I/U + visibility.
            if (existingCol) {
              updateOrInsertOptions.push(
                GanttViewColumn.update(context, existingCol.id, column, ncMeta),
              );
            } else {
              updateOrInsertOptions.push(
                GanttViewColumn.insert(
                  context,
                  {
                    ...(column as any),
                    fk_view_id: viewId,
                    fk_column_id: columnId,
                  },
                  ncMeta,
                ),
              );
            }
            break;
        }
      }

      await Promise.all(updateOrInsertOptions);

      await ncMeta.commit();

      await View.clearSingleQueryCache(context, view.fk_model_id, [view]);

      if (viewWebhookManager) {
        (
          await viewWebhookManager.withNewViewId(viewWebhookManager.getViewId())
        ).emit();
      }

      return result;
    } catch (e) {
      await ncMeta.rollback();
      if (e instanceof AtError || e instanceof AtBaseError) throw e;
      this.logger.error('Error updating view columns', e);
      AtError.get(context).badRequest('Bad Request');
    }
  }

  async viewColumnList(
    context: AtContext,
    param: { viewId: string; req: any },
  ) {
    const columnList = await View.getColumns(context, param.viewId, undefined);

    // generate key-value pair of column id and column
    const columnMap = columnList.reduce((acc, column) => {
      acc[column.fk_column_id] = column;
      return acc;
    }, {});

    return columnMap;
  }
}
