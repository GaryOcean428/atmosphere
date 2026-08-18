import type { BoolType, KanbanColumnType } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import View from '~/models/View';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import { CacheGetType, CacheScope, MetaTable } from '~/utils/globals';

export default class KanbanViewColumn implements KanbanColumnType {
  id: string;
  title?: string;
  show?: BoolType;
  order?: number;

  fk_view_id: string;
  fk_column_id: string;
  fk_workspace_id?: string;
  base_id?: string;
  source_id?: string;

  constructor(data: KanbanViewColumn) {
    Object.assign(this, data);
  }

  public static async get(
    context: AtContext,
    kanbanViewColumnId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    let viewColumn =
      kanbanViewColumnId &&
      (await AtmosphereCache.get(
        context,
        `${CacheScope.KANBAN_VIEW_COLUMN}:${kanbanViewColumnId}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!viewColumn) {
      viewColumn = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.KANBAN_VIEW_COLUMNS,
        kanbanViewColumnId,
      );
      if (viewColumn) {
        await AtmosphereCache.set(
          context,
          `${CacheScope.KANBAN_VIEW_COLUMN}:${kanbanViewColumnId}`,
          viewColumn,
        );
      }
    }
    return viewColumn && new KanbanViewColumn(viewColumn);
  }
  static async insert(
    context: AtContext,
    column: Partial<KanbanViewColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(column, [
      'fk_view_id',
      'fk_column_id',
      'show',
      'base_id',
      'source_id',
    ]);

    insertObj.order = await ncMeta.metaGetNextOrder(
      MetaTable.KANBAN_VIEW_COLUMNS,
      {
        fk_view_id: column.fk_view_id,
      },
    );

    if (!insertObj.source_id) {
      const viewRef = await View.get(
        context,
        insertObj.fk_view_id,
        false,
        ncMeta,
      );
      insertObj.source_id = viewRef.source_id;
    }

    const { id } = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.KANBAN_VIEW_COLUMNS,
      insertObj,
    );

    return this.get(context, id, ncMeta).then(async (kanbanViewColumn) => {
      await AtmosphereCache.appendToList(
        context,
        CacheScope.KANBAN_VIEW_COLUMN,
        [column.fk_view_id],
        `${CacheScope.KANBAN_VIEW_COLUMN}:${id}`,
      );
      return kanbanViewColumn;
    });
  }

  public static async list(
    context: AtContext,
    viewId: string,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<KanbanViewColumn[]> {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.KANBAN_VIEW_COLUMN,
      [viewId],
    );
    let { list: views } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !views.length) {
      views = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.KANBAN_VIEW_COLUMNS,
        {
          condition: {
            fk_view_id: viewId,
          },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.KANBAN_VIEW_COLUMN,
        [viewId],
        views,
      );
    }
    views.sort(
      (a, b) =>
        (a.order != null ? a.order : Infinity) -
        (b.order != null ? b.order : Infinity),
    );
    return views?.map((v) => new KanbanViewColumn(v));
  }

  // todo: update prop names
  static async update(
    context: AtContext,
    columnId: string,
    body: Partial<KanbanViewColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(body, ['order', 'show']);

    // set meta
    const res = await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.KANBAN_VIEW_COLUMNS,
      updateObj,
      columnId,
    );

    // get existing cache
    const key = `${CacheScope.KANBAN_VIEW_COLUMN}:${columnId}`;
    await AtmosphereCache.update(context, key, updateObj);

    // on view column update, delete any optimised single query cache
    {
      const viewCol = await this.get(context, columnId, ncMeta);
      if (viewCol?.fk_view_id) {
        const view = await View.get(context, viewCol.fk_view_id, false, ncMeta);
        if (view) {
          await View.clearSingleQueryCache(context, view.fk_model_id, [view]);
        }
      }
    }

    return res;
  }
}
