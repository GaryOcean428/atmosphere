import type { GridType, MetaType } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import GridViewColumn from '~/models/GridViewColumn';
import View from '~/models/View';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import { CacheGetType, CacheScope, MetaTable } from '~/utils/globals';
import { prepareForDb, prepareForResponse } from '~/utils/modelUtils';

export default class GridView implements GridType {
  fk_view_id: string;
  fk_workspace_id?: string;
  base_id?: string;
  source_id?: string;
  meta?: MetaType;
  row_height?: number;
  columns?: GridViewColumn[];

  constructor(data: GridView) {
    Object.assign(this, data);
  }

  async getColumns(context: AtContext): Promise<GridViewColumn[]> {
    return (this.columns = await GridViewColumn.list(context, this.fk_view_id));
  }

  public static async get(
    context: AtContext,
    viewId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    let view =
      viewId &&
      (await AtmosphereCache.get(
        context,
        `${CacheScope.GRID_VIEW}:${viewId}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!view) {
      view = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.GRID_VIEW,
        {
          fk_view_id: viewId,
        },
      );
      await AtmosphereCache.set(context, `${CacheScope.GRID_VIEW}:${viewId}`, view);
    }

    return view && new GridView(view);
  }

  static async insert(
    context: AtContext,
    view: Partial<GridView>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(view, [
      'fk_view_id',
      'base_id',
      'source_id',
      'row_height',
      'meta',
    ]);

    const viewRef = await View.get(
      context,
      insertObj.fk_view_id,
      false,
      ncMeta,
    );

    if (!insertObj.source_id) {
      insertObj.source_id = viewRef.source_id;
    }

    await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.GRID_VIEW,
      insertObj,
      true,
    );

    return this.get(context, view.fk_view_id, ncMeta);
  }

  static async getWithInfo(
    context: AtContext,
    id: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const view = await this.get(context, id, ncMeta);
    return view;
  }

  static async update(
    context: AtContext,
    viewId: string,
    body: Partial<GridView>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(body, ['row_height', 'meta']);

    // update meta
    const res = await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.GRID_VIEW,
      prepareForDb(updateObj),
      {
        fk_view_id: viewId,
      },
    );

    await AtmosphereCache.update(
      context,
      `${CacheScope.GRID_VIEW}:${viewId}`,
      prepareForResponse(updateObj),
    );

    return res;
  }
}
