import type {
  BoolType,
  COMPARISON_OPS,
  COMPARISON_SUB_OPS,
  FilterType,
} from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import Model from '~/models/Model';
import Column from '~/models/Column';
import Hook from '~/models/Hook';
import View from '~/models/View';
import ListViewLevel from '~/models/ListViewLevel';
import Atmosphere from '~/Atmosphere';
import {
  CacheDelDirection,
  CacheGetType,
  CacheScope,
  FilterCacheScope,
  MetaTable,
} from '~/utils/globals';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { AtError } from '~/helpers/catchError';
import { extractProps } from '~/helpers/extractProps';
import { parseMetaProp, stringifyMetaProp } from '~/utils/modelUtils';
import { isReplay } from '~/helpers/replayScope';

/**
 * Link flat filter rows into root filters with their `children` populated.
 *
 * No depth cap on purpose. A cap would silently drop the conditions below it,
 * and for RLS a dropped condition is not a narrower filter — an unpopulated
 * `children` makes `getChildren()` fall through and reload the raw rows from
 * cache, undoing any substitution already applied to them. Truncating here
 * fails *open*.
 *
 * It also isn't needed: every row has exactly one `fk_parent_id` and the walk
 * starts only at rows that have none, so each row is reached at most once, via
 * its single parent. Rows in a `fk_parent_id` cycle have no root in their
 * component and are therefore never reached at all — the traversal can't
 * revisit a node, let alone loop.
 *
 * Exported for tests; `rootFilterTreeByRlsPolicy` is the real entry point.
 */
export function linkFilterRowsIntoTree<
  T extends { id?: string; fk_parent_id?: string; children?: T[] },
>(rows: T[]): T[] {
  const roots: T[] = [];
  const childrenByParent = new Map<string, T[]>();

  for (const row of rows ?? []) {
    if (!row.fk_parent_id) {
      roots.push(row);
      continue;
    }
    const siblings = childrenByParent.get(row.fk_parent_id) ?? [];
    siblings.push(row);
    childrenByParent.set(row.fk_parent_id, siblings);
  }

  const attachChildren = (row: T) => {
    const children = row.id && childrenByParent.get(row.id);
    if (!children?.length) return;
    row.children = children;
    for (const child of children) attachChildren(child);
  };

  for (const root of roots) attachChildren(root);

  return roots;
}

export default class Filter implements FilterType {
  id: string;

  fk_workspace_id?: string;
  fk_model_id?: string;
  fk_view_id?: string;
  fk_hook_id?: string;
  fk_level_id?: string;
  fk_parent_column_id?: string;
  fk_column_id?: string;
  fk_parent_id?: string;
  fk_row_color_condition_id: string;
  fk_link_col_id?: string;
  fk_value_col_id?: string;
  fk_rls_policy_id?: string;
  fk_button_col_id?: string;
  fk_widget_id?: string;

  // Set by replaceDynamicFieldWithValue (EE) when fk_value_col_id points to a
  // cross-table column. Carries the source/parent row PK so conditionV2 can
  // build an EXISTS subquery filtered to that specific row.
  _crossTableRowId?: string;

  comparison_op?: (typeof COMPARISON_OPS)[number];
  comparison_sub_op?: (typeof COMPARISON_SUB_OPS)[number];

  value?: string;

  logical_op?: 'and' | 'or' | 'not';
  is_group?: BoolType;
  children?: Filter[];
  base_id?: string;
  source_id?: string;
  column?: Column;
  order?: number;
  meta?: any;
  enabled?: BoolType;

  constructor(data: Filter | FilterType) {
    Object.assign(this, data);
    this.meta = parseMetaProp(this);
  }

  public static castType(filter: Filter): Filter {
    return filter && new Filter(filter);
  }

  public castType(filter: Filter): Filter {
    return filter && new Filter(filter);
  }

  static async supportToggle(_context: AtContext) {
    return false;
  }

  public async getModel(
    context: AtContext,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Model> {
    return this.fk_view_id
      ? (await View.get(context, this.fk_view_id, false, ncMeta)).getModel(
          context,
          ncMeta,
        )
      : Model.getByIdOrName(
          context,
          {
            id: this.fk_model_id,
          },
          ncMeta,
        );
  }

  public static async insert(
    context: AtContext,
    filter: Partial<FilterType & { meta?: any | string }>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(filter, [
      'id',
      'fk_view_id',
      'fk_hook_id',
      'fk_level_id',
      'fk_link_col_id',
      'fk_value_col_id',
      'fk_parent_column_id',
      'fk_row_color_condition_id',
      'fk_rls_policy_id',
      'fk_button_col_id',
      'fk_column_id',
      'comparison_op',
      'comparison_sub_op',
      'value',
      'fk_parent_id',
      'is_group',
      'logical_op',
      'base_id',
      'source_id',
      'order',
      'meta',
      'enabled',
    ]);

    const referencedModelColName = [
      'fk_parent_column_id',
      'fk_view_id',
      'fk_hook_id',
      'fk_row_color_condition_id',
      'fk_link_col_id',
      'fk_rls_policy_id',
      'fk_button_col_id',
    ].find((k) => filter[k]);
    const replayKeepOrder = isReplay() && filter.order != null;
    if (!replayKeepOrder) {
      insertObj.order = await ncMeta.metaGetNextOrder(MetaTable.FILTER_EXP, {
        [referencedModelColName]: filter[referencedModelColName],
      });
    }

    if (!filter.source_id) {
      let model: { base_id?: string; source_id?: string };
      if (filter.fk_view_id && !filter.fk_parent_column_id) {
        model = await View.get(context, filter.fk_view_id, false, ncMeta);
      } else if (filter.fk_hook_id) {
        model = await Hook.get(context, filter.fk_hook_id, false, ncMeta);
      } else if (filter.fk_link_col_id) {
        model = await Column.get(
          context,
          { colId: filter.fk_link_col_id },
          ncMeta,
        );
      } else if (filter.fk_parent_column_id) {
        model = await Column.get(
          context,
          { colId: filter.fk_parent_column_id },
          ncMeta,
        );
      } else if (filter.fk_button_col_id) {
        model = await Column.get(
          context,
          { colId: filter.fk_button_col_id },
          ncMeta,
        );
      } else if (filter.fk_column_id) {
        model = await Column.get(
          context,
          { colId: filter.fk_column_id },
          ncMeta,
        );
      } else if (filter.fk_level_id) {
        const level = await ListViewLevel.get(
          context,
          filter.fk_level_id,
          ncMeta,
        );
        if (level?.fk_model_id) {
          model = await Model.get(context, level.fk_model_id, false, ncMeta);
        }
      } else {
        AtError.invalidFilter(JSON.stringify(filter));
      }

      if (model != null) {
        insertObj.source_id = model.source_id;
      }
    }
    if (!insertObj.meta) {
      insertObj.meta = {};
    }
    insertObj.meta = stringifyMetaProp(insertObj);

    const row = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.FILTER_EXP,
      insertObj,
    );
    if (filter?.children?.length) {
      await Promise.all(
        filter.children.map((f) =>
          this.insert(
            context,
            {
              ...f,
              fk_parent_id: row.id,
              [referencedModelColName]: filter[referencedModelColName],
            },
            ncMeta,
          ),
        ),
      );
    }
    return await this.redisPostInsert(context, row.id, filter, ncMeta);
  }

  static async redisPostInsert(
    context: AtContext,
    id,
    filter: Partial<FilterType>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    if (
      !(
        id &&
        (filter.fk_view_id ||
          filter.fk_hook_id ||
          filter.fk_parent_column_id ||
          filter.fk_level_id ||
          filter.fk_button_col_id)
      )
    ) {
      AtError.get(context).badRequest(
        `Mandatory fields missing in FILTER_EXP cache population : id(${id}), fk_view_id(${filter.fk_view_id}), fk_hook_id(${filter.fk_hook_id}), fk_parent_column_id(${filter.fk_parent_column_id}), fk_level_id(${filter.fk_level_id}), fk_button_col_id(${filter.fk_button_col_id})`,
      );
    }
    const key = `${CacheScope.FILTER_EXP}:${id}`;
    let value = await AtmosphereCache.get(context, key, CacheGetType.TYPE_OBJECT);
    if (!value) {
      /* get from db */
      value = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        id,
      );

      /* store in redis */
      await AtmosphereCache.set(context, key, value).then(async () => {
        /* append key to relevant lists */
        const p = [];
        if (filter.fk_view_id) {
          p.push(
            AtmosphereCache.appendToList(
              context,
              CacheScope.FILTER_EXP,
              [FilterCacheScope.VIEW, filter.fk_view_id],
              key,
            ),
          );
        }
        if (filter.fk_hook_id) {
          p.push(
            AtmosphereCache.appendToList(
              context,
              CacheScope.FILTER_EXP,
              [FilterCacheScope.HOOK, filter.fk_hook_id],
              key,
            ),
          );
        }
        if (filter.fk_parent_column_id) {
          p.push(
            AtmosphereCache.appendToList(
              context,
              CacheScope.FILTER_EXP,
              [FilterCacheScope.PARENT_COLUMN, filter.fk_parent_column_id],
              key,
            ),
          );
        }
        if (filter.fk_parent_id) {
          if (filter.fk_view_id) {
            p.push(
              AtmosphereCache.appendToList(
                context,
                CacheScope.FILTER_EXP,
                [FilterCacheScope.VIEW, filter.fk_view_id, filter.fk_parent_id],
                key,
              ),
            );
          }
          if (filter.fk_hook_id) {
            p.push(
              AtmosphereCache.appendToList(
                context,
                CacheScope.FILTER_EXP,
                [FilterCacheScope.HOOK, filter.fk_hook_id, filter.fk_parent_id],
                key,
              ),
            );
          }
          if (filter.fk_parent_column_id) {
            p.push(
              AtmosphereCache.appendToList(
                context,
                CacheScope.FILTER_EXP,
                [
                  FilterCacheScope.PARENT_COLUMN,
                  filter.fk_parent_column_id,
                  filter.fk_parent_id,
                ],
                key,
              ),
            );
          }
          if (filter.fk_rls_policy_id) {
            p.push(
              AtmosphereCache.appendToList(
                context,
                CacheScope.FILTER_EXP,
                [
                  FilterCacheScope.RLS_POLICY,
                  filter.fk_rls_policy_id,
                  filter.fk_parent_id,
                ],
                key,
              ),
            );
          }
          p.push(
            AtmosphereCache.appendToList(
              context,
              CacheScope.FILTER_EXP,
              [FilterCacheScope.PARENT, filter.fk_parent_id],
              key,
            ),
          );
        }
        if (filter.fk_column_id) {
          p.push(
            AtmosphereCache.appendToList(
              context,
              CacheScope.FILTER_EXP,
              [FilterCacheScope.COLUMN, filter.fk_column_id],
              key,
            ),
          );
        }
        if (filter.fk_rls_policy_id) {
          p.push(
            AtmosphereCache.appendToList(
              context,
              CacheScope.FILTER_EXP,
              [FilterCacheScope.RLS_POLICY, filter.fk_rls_policy_id],
              key,
            ),
          );
        }
        if (filter.fk_button_col_id) {
          p.push(
            AtmosphereCache.appendToList(
              context,
              CacheScope.FILTER_EXP,
              [FilterCacheScope.BUTTON_COLUMN, filter.fk_button_col_id],
              key,
            ),
          );
        }
        await Promise.all(p);
      });
    }

    // on new filter creation delete any optimised single query cache
    {
      // if not a view filter then no need to delete
      if (filter.fk_view_id) {
        const view = await View.get(context, filter.fk_view_id, false, ncMeta);

        // View may be missing if it was deleted concurrently or the filter
        // is orphaned — skip cache invalidation rather than throwing.
        if (view) {
          await View.clearSingleQueryCache(
            context,
            view.fk_model_id,
            [view],
            ncMeta,
          );
        }
      }
    }

    return this.castType(value);
  }

  static async update(
    context: AtContext,
    id,
    filter: Partial<Filter>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(filter, [
      'fk_column_id',
      'comparison_op',
      'comparison_sub_op',
      'value',
      'fk_parent_id',
      // Allow re-tagging a filter to a list-view level. Needed so the GUI can heal
      // legacy filters that were saved with fk_level_id = null (counted but never
      // applied) by assigning them to the level that owns their column.
      'fk_level_id',
      'is_group',
      'logical_op',
      'fk_value_col_id',
      'meta',
      'order',
      'enabled',
    ]);

    if (!updateObj.meta) {
      updateObj.meta = {};
    }
    updateObj.meta = stringifyMetaProp(updateObj);
    // set meta
    const res = await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.FILTER_EXP,
      updateObj,
      id,
    );

    ncMeta.knex.attachToTransaction(async () => {
      await AtmosphereCache.update(
        context,
        `${CacheScope.FILTER_EXP}:${id}`,
        updateObj,
      );
    });

    // on update delete any optimised single query cache
    {
      const filter = await this.get(context, id, ncMeta);
      // if not a view filter then no need to delete
      if (filter?.fk_view_id) {
        const view = await View.get(context, filter.fk_view_id, false, ncMeta);
        if (view) {
          await View.clearSingleQueryCache(
            context,
            view.fk_model_id,
            [{ id: filter.fk_view_id }],
            ncMeta,
          );
        }
      }
    }

    return res;
  }

  static async delete(context: AtContext, id: string, ncMeta = Atmosphere.ncMeta) {
    const filter = await this.get(context, id, ncMeta);

    // Guard against deleting an already-removed filter
    if (!filter) return;

    const deleteRecursively = async (filter: Filter) => {
      if (!filter || filter.id === filter.fk_parent_id) return;
      for (const f of (await filter?.getChildren(context, ncMeta)) || [])
        await deleteRecursively(f);
      await ncMeta.metaDelete(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        filter.id,
      );
      await AtmosphereCache.deepDel(
        context,
        `${CacheScope.FILTER_EXP}:${filter.id}`,
        CacheDelDirection.CHILD_TO_PARENT,
      );
    };
    await deleteRecursively(filter);

    // delete any optimised single query cache
    {
      // if not a view filter then no need to delete
      if (filter.fk_view_id) {
        const view = await View.get(context, filter.fk_view_id, false, ncMeta);

        if (view) {
          await View.clearSingleQueryCache(
            context,
            view.fk_model_id,
            [{ id: filter.fk_view_id }],
            ncMeta,
          );
        }
      }
    }
  }

  public getColumn(context: AtContext, ncMeta = Atmosphere.ncMeta): Promise<Column> {
    if (!this.fk_column_id) return null;
    return Column.get(
      context,
      {
        colId: this.fk_column_id,
      },
      ncMeta,
    );
  }

  public static async getFiltersByColumn(
    context: AtContext,
    columnId: string,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Filter[]> {
    if (!columnId) return null;

    const filters = await ncMeta.metaList2(
      context.workspace_id,
      context.base_id,
      MetaTable.FILTER_EXP,
      {
        condition: {
          fk_column_id: columnId,
        },
      },
    );

    return filters?.map((f) => this.castType(f));
  }

  public async getGroup(
    context: AtContext,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Filter> {
    if (!this.fk_parent_id) return null;
    let filterObj = await AtmosphereCache.get(
      context,
      `${CacheScope.FILTER_EXP}:${this.fk_parent_id}`,
      2,
    );
    if (!filterObj) {
      filterObj = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          id: this.fk_parent_id,
        },
      );
      await AtmosphereCache.set(
        context,
        `${CacheScope.FILTER_EXP}:${this.fk_parent_id}`,
        filterObj,
      );
    }
    return this.castType(filterObj);
  }

  public async getChildren(
    context: AtContext,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Filter[]> {
    if (this.children) return this.children;
    if (!this.is_group || !this.id) return null;
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.PARENT, this.id],
      {
        key: 'order',
      },
    );
    let { list: childFilters } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !childFilters.length) {
      childFilters = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: {
            fk_parent_id: this.id,
          },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.PARENT, this.id],
        childFilters,
      );
    }
    return childFilters && childFilters.map((f) => this.castType(f));
  }

  // public static async getFilter({
  //   viewId
  // }: {
  //   viewId: string;
  // }): Promise<Filter> {
  //   if (!viewId) return null;
  //
  //   const filterObj = await ncMeta.metaGet2(
  // context.workspace_id,
  // context.base_id,
  //     MetaTable.FILTER_EXP,
  //     { fk_view_id: viewId, fk_parent_id: null }
  //   );
  //   return filterObj && new Filter(filterObj);
  // }

  public static async getFilterObject(
    context: AtContext,
    {
      viewId,
      hookId,
      linkColId,
      parentColId,
      widgetId,
      rlsPolicyId,
      buttonColId,
    }: {
      viewId?: string;
      hookId?: string;
      linkColId?: string;
      parentColId?: string;
      widgetId?: string;
      rlsPolicyId?: string;
      buttonColId?: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ): Promise<FilterType> {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [
        parentColId ||
          viewId ||
          hookId ||
          linkColId ||
          widgetId ||
          rlsPolicyId ||
          buttonColId,
      ],
      {
        key: 'order',
      },
    );
    let { list: filters } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !filters.length) {
      const condition: Record<string, string> = {};

      if (viewId && !parentColId) {
        condition.fk_view_id = viewId;
      } else if (hookId) {
        condition.fk_hook_id = hookId;
      } else if (linkColId) {
        condition.fk_link_col_id = linkColId;
      } else if (parentColId) {
        condition.fk_parent_column_id = parentColId;
      } else if (widgetId) {
        condition.fk_widget_id = widgetId;
      } else if (rlsPolicyId) {
        condition.fk_rls_policy_id = rlsPolicyId;
      } else if (buttonColId) {
        condition.fk_button_col_id = buttonColId;
      }

      filters = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition,
          orderBy: {
            order: 'asc',
          },
        },
      );

      let filterCacheScope: FilterCacheScope;

      if (parentColId) {
        filterCacheScope = FilterCacheScope.PARENT_COLUMN;
      } else if (viewId) {
        filterCacheScope = FilterCacheScope.VIEW;
      } else if (hookId) {
        filterCacheScope = FilterCacheScope.HOOK;
      } else if (linkColId) {
        filterCacheScope = FilterCacheScope.LINK_COL;
      } else if (widgetId) {
        filterCacheScope = FilterCacheScope.WIDGET;
      } else if (rlsPolicyId) {
        filterCacheScope = FilterCacheScope.RLS_POLICY;
      } else if (buttonColId) {
        filterCacheScope = FilterCacheScope.BUTTON_COLUMN;
      }

      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [
          filterCacheScope,
          parentColId ||
            viewId ||
            hookId ||
            linkColId ||
            widgetId ||
            rlsPolicyId ||
            buttonColId,
        ],
        filters,
      );
    }

    const result: FilterType = {
      is_group: true,
      children: [],
      logical_op: 'and',
    };

    /**
     * NOTE:
     * Earlier implementation relied on filter creation order when attaching children.
     * Now that filters support reordering, creation order is no longer reliable.
     *
     * This caused flattened filters to appear in the wrong sequence, leading to
     * incorrect parent–child relationships during import / duplicate base flows.
     *
     * The new approach explicitly groups by `fk_parent_id`, sorts by `order`,
     * and flattens the tree deterministically to preserve correct hierarchy.
     */

    // parentId -> children
    const childrenMap = new Map<string, FilterType[]>();

    // 1️⃣ Group by fk_parent_id
    for (const filter of filters) {
      const parentId = filter.fk_parent_id ?? 'root';

      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }

      childrenMap.get(parentId)!.push(filter);
    }

    // 2️⃣ Sort siblings by order
    for (const [, list] of childrenMap) {
      list.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    }

    // 3️⃣ DFS → FLAT push (parent first, then children)
    const flat: FilterType[] = [];

    const walk = (parentId: string) => {
      const children = childrenMap.get(parentId);
      if (!children) return;

      for (const child of children) {
        flat.push(child);
        walk(child.id!);
      }
    };

    walk('root');

    // 4️⃣ Assign flat ordered result
    result.children = flat;

    return result;
  }

  // skip viewWebhookManager for this, deleteAll is not a standalone operation, it's invoked by view service
  static async deleteAll(
    context: AtContext,
    viewId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const filter = await this.getFilterObject(context, { viewId }, ncMeta);

    const deleteRecursively = async (filter) => {
      if (!filter) return;
      for (const f of filter?.children || []) await deleteRecursively(f);
      if (filter.id) {
        await ncMeta.metaDelete(
          context.workspace_id,
          context.base_id,
          MetaTable.FILTER_EXP,
          filter.id,
        );
        await AtmosphereCache.deepDel(
          context,
          `${CacheScope.FILTER_EXP}:${filter.id}`,
          CacheDelDirection.CHILD_TO_PARENT,
        );
      }
    };
    await deleteRecursively(filter);

    // on update delete any optimised single query cache
    {
      const view = await View.get(context, viewId, false, ncMeta);
      if (view) {
        await View.clearSingleQueryCache(
          context,
          view.fk_model_id,
          [view],
          ncMeta,
        );
      }
    }
  }

  static async deleteAllByHook(
    context: AtContext,
    hookId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const filter = await this.getFilterObject(context, { hookId }, ncMeta);

    const deleteRecursively = async (filter) => {
      if (!filter) return;
      for (const f of filter?.children || []) await deleteRecursively(f);
      if (filter.id) {
        await ncMeta.metaDelete(
          context.workspace_id,
          context.base_id,
          MetaTable.FILTER_EXP,
          filter.id,
        );
        await AtmosphereCache.deepDel(
          context,
          `${CacheScope.FILTER_EXP}:${filter.id}`,
          CacheDelDirection.CHILD_TO_PARENT,
        );
      }
    };
    await deleteRecursively(filter);
  }

  static async deleteAllByRlsPolicy(
    context: AtContext,
    rlsPolicyId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const filter = await this.getFilterObject(context, { rlsPolicyId }, ncMeta);

    const deleteRecursively = async (filter) => {
      if (!filter) return;
      for (const f of filter?.children || []) await deleteRecursively(f);
      if (filter.id) {
        await ncMeta.metaDelete(
          context.workspace_id,
          context.base_id,
          MetaTable.FILTER_EXP,
          filter.id,
        );
        await AtmosphereCache.deepDel(
          context,
          `${CacheScope.FILTER_EXP}:${filter.id}`,
          CacheDelDirection.CHILD_TO_PARENT,
        );
      }
    };
    await deleteRecursively(filter);
  }

  static async deleteAllByParentColumn(
    context: AtContext,
    parentColId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const filter = await this.getFilterObject(context, { parentColId }, ncMeta);

    const deleteRecursively = async (filter) => {
      if (!filter) return;
      for (const f of filter?.children || []) await deleteRecursively(f);
      if (filter.id) {
        await ncMeta.metaDelete(
          context.workspace_id,
          context.base_id,
          MetaTable.FILTER_EXP,
          filter.id,
        );
        await AtmosphereCache.deepDel(
          context,
          `${CacheScope.FILTER_EXP}:${filter.id}`,
          CacheDelDirection.CHILD_TO_PARENT,
        );
      }
    };
    await deleteRecursively(filter);
  }

  public static async get(
    context: AtContext,
    id: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    let filterObj =
      id &&
      (await AtmosphereCache.get(
        context,
        `${CacheScope.FILTER_EXP}:${id}`,
        CacheGetType.TYPE_OBJECT,
      ));
    if (!filterObj) {
      filterObj = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          id,
        },
      );
      await AtmosphereCache.set(context, `${CacheScope.FILTER_EXP}:${id}`, filterObj);
    }
    return this.castType(filterObj);
  }

  static async allViewFilterList(
    context: AtContext,
    { viewId }: { viewId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(context, CacheScope.FILTER_EXP, [
      FilterCacheScope.VIEW,
      viewId,
    ]);
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;

    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_view_id: viewId },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.VIEW, viewId],
        filterObjs,
      );
    }

    return filterObjs?.map((f) => this.castType(f)) || [];
  }

  static async allHookFilterList(
    context: AtContext,
    { hookId }: { hookId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(context, CacheScope.FILTER_EXP, [
      FilterCacheScope.HOOK,
      hookId,
    ]);
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;

    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_hook_id: hookId },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.HOOK, hookId],
        filterObjs,
      );
    }

    return filterObjs?.map((f) => this.castType(f)) || [];
  }

  static async rootFilterList(
    context: AtContext,
    { viewId }: { viewId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.VIEW, viewId],
      {
        key: 'order',
      },
    );
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;

    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_view_id: viewId },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.VIEW, viewId],
        filterObjs,
      );
    }

    return filterObjs
      ?.filter((f) => !f.fk_parent_id)
      ?.map((f) => this.castType(f));
  }

  static async rootFilterListByHook(
    context: AtContext,
    { hookId }: { hookId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.VIEW, hookId],
      { key: 'order' },
    );
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_hook_id: hookId },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.HOOK, hookId],
        filterObjs,
      );
    }
    return filterObjs
      ?.filter((f) => !f.fk_parent_id)
      ?.map((f) => this.castType(f));
  }

  /** Every filter row of an RLS policy, roots and nested children alike. */
  protected static async filterObjsByRlsPolicy(
    context: AtContext,
    { rlsPolicyId }: { rlsPolicyId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.RLS_POLICY, rlsPolicyId],
      { key: 'order' },
    );
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_rls_policy_id: rlsPolicyId },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.RLS_POLICY, rlsPolicyId],
        filterObjs,
      );
    }
    return filterObjs;
  }

  static async rootFilterListByRlsPolicy(
    context: AtContext,
    { rlsPolicyId }: { rlsPolicyId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const filterObjs = await this.filterObjsByRlsPolicy(
      context,
      { rlsPolicyId },
      ncMeta,
    );
    return filterObjs
      ?.filter((f) => !f.fk_parent_id)
      ?.map((f) => this.castType(f));
  }

  /**
   * The same policy's filters, but as root filters with their `children`
   * already populated in memory.
   *
   * RLS enforcement must use this, not `rootFilterListByRlsPolicy`. That one
   * returns root rows with `children` unset, so `getChildren` reloads them
   * straight from the cache *after* `resolveRlsDynamicValues` has run — a
   * placeholder nested inside a filter group would never be substituted and
   * would reach SQL as literal `{currentUser.x}` text. Under a negated
   * operator that literal inverts into a match-everything clause.
   *
   * Resolving the whole tree up front also makes `getChildren` a no-op: it
   * short-circuits on an already-set `children`, so the substituted children
   * are the ones that get compiled.
   */
  static async rootFilterTreeByRlsPolicy(
    context: AtContext,
    { rlsPolicyId }: { rlsPolicyId: string },
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Filter[]> {
    const filterObjs = await this.filterObjsByRlsPolicy(
      context,
      { rlsPolicyId },
      ncMeta,
    );

    return linkFilterRowsIntoTree(
      (filterObjs ?? []).map((f) => this.castType(f)),
    );
  }

  static async rootFilterListByParentColumn(
    context: AtContext,
    { parentColId }: { parentColId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.PARENT_COLUMN, parentColId],
      { key: 'order' },
    );
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_parent_column_id: parentColId },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.PARENT_COLUMN, parentColId],
        filterObjs,
      );
    }
    return filterObjs
      ?.filter((f) => !f.fk_parent_id)
      ?.map((f) => this.castType(f));
  }

  static async parentFilterList(
    context: AtContext,
    {
      parentId,
    }: {
      parentId: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.PARENT, parentId],
      { key: 'order' },
    );
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: {
            fk_parent_id: parentId,
            // fk_view_id: viewId,
          },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.PARENT, parentId],
        filterObjs,
      );
    }
    return filterObjs?.map((f) => this.castType(f));
  }

  static async parentFilterListByHook(
    context: AtContext,
    {
      hookId,
      parentId,
    }: {
      hookId: string;
      parentId: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.HOOK, hookId, parentId],
      {
        key: 'order',
      },
    );
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: {
            fk_parent_id: parentId,
            fk_hook_id: hookId,
          },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.HOOK, hookId, parentId],
        filterObjs,
      );
    }
    return filterObjs?.map((f) => this.castType(f));
  }

  static async parentFilterListByParentColumn(
    context: AtContext,
    {
      parentColId,
      parentId,
    }: {
      parentColId: string;
      parentId: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.FILTER_EXP,
      [FilterCacheScope.PARENT_COLUMN, parentColId, parentId],
      {
        key: 'order',
      },
    );
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: {
            fk_parent_id: parentId,
            fk_parent_column_id: parentColId,
          },
          orderBy: {
            order: 'asc',
          },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.PARENT_COLUMN, parentColId, parentId],
        filterObjs,
      );
    }
    return filterObjs?.map((f) => this.castType(f));
  }

  static async hasEmptyOrNullFilters(
    context: AtContext,
    baseId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const emptyOrNullFilterObjs = await ncMeta.metaList2(
      context.workspace_id,
      context.base_id,
      MetaTable.FILTER_EXP,
      {
        condition: {
          base_id: baseId,
        },
        xcCondition: {
          _or: [
            {
              comparison_op: {
                eq: 'null',
              },
            },
            {
              comparison_op: {
                eq: 'notnull',
              },
            },
            {
              comparison_op: {
                eq: 'empty',
              },
            },
            {
              comparison_op: {
                eq: 'notempty',
              },
            },
          ],
        },
      },
    );
    return emptyOrNullFilterObjs.length > 0;
  }

  static async rootFilterListByLink(
    _context: AtContext,
    { columnId: _columnId }: { columnId: string },
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return [];
  }

  static async allLinkFilterList(
    context: AtContext,
    { linkColumnId }: { linkColumnId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(context, CacheScope.FILTER_EXP, [
      FilterCacheScope.LINK_COL,
      linkColumnId,
    ]);
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;

    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_link_col_id: linkColumnId },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.LINK_COL, linkColumnId],
        filterObjs,
      );
    }

    return filterObjs?.map((f) => this.castType(f)) || [];
  }

  static async updateAllChildrenLogicalOp(
    context: AtContext,
    {
      parentFilterId,
      logicalOp,
      viewId,
    }: { viewId: string; parentFilterId: string; logicalOp: 'and' | 'or' },
    ncMeta = Atmosphere.ncMeta,
  ) {
    let filters;
    if (parentFilterId === 'root') {
      filters = await Filter.rootFilterList(context, { viewId }, ncMeta);
    } else {
      const filter = await this.get(context, parentFilterId);
      if (!filter.is_group) {
        return;
      }
      filters = await filter.getChildren(context, ncMeta);
    }

    for (const child of filters || []) {
      await Filter.update(context, child.id, { logical_op: logicalOp }, ncMeta);
    }
  }

  async extractRelatedParentMetas(context, ncMeta = Atmosphere.ncMeta) {
    let parentData:
      | {
          view: View;
        }
      | {
          hook: Hook;
        }
      | {
          linkColumn: Column;
        };

    if (this.fk_view_id) {
      parentData = {
        view: await View.get(context, this.fk_view_id, false, ncMeta),
      };
    } else if (this.fk_hook_id) {
      parentData = {
        hook: await Hook.get(context, this.fk_hook_id, false, ncMeta),
      };
    } else if (this.fk_link_col_id) {
      parentData = {
        linkColumn: await Column.get(
          context,
          { colId: this.fk_link_col_id },
          ncMeta,
        ),
      };
    }

    return parentData;
  }

  static async rootFilterListByWidget(
    _context: AtContext,
    _params: any,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return [];
  }

  static async allButtonFilterList(
    context: AtContext,
    { buttonColId }: { buttonColId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(context, CacheScope.FILTER_EXP, [
      FilterCacheScope.BUTTON_COLUMN,
      buttonColId,
    ]);
    let { list: filterObjs } = cachedList;
    const { isNoneList } = cachedList;

    if (!isNoneList && !filterObjs.length) {
      filterObjs = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.FILTER_EXP,
        {
          condition: { fk_button_col_id: buttonColId },
        },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.FILTER_EXP,
        [FilterCacheScope.BUTTON_COLUMN, buttonColId],
        filterObjs,
      );
    }

    return filterObjs?.map((f) => this.castType(f)) || [];
  }

  static async rootFilterListByButtonColumn(
    _context: AtContext,
    { buttonColId: _buttonColId }: { buttonColId: string },
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return [];
  }

  static async deleteAllByButtonColumn(
    context: AtContext,
    buttonColId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const filter = await this.getFilterObject(context, { buttonColId }, ncMeta);

    const deleteRecursively = async (filter) => {
      if (!filter) return;
      for (const f of filter?.children || []) await deleteRecursively(f);
      if (filter.id) {
        await ncMeta.metaDelete(
          context.workspace_id,
          context.base_id,
          MetaTable.FILTER_EXP,
          filter.id,
        );
        await AtmosphereCache.deepDel(
          context,
          `${CacheScope.FILTER_EXP}:${filter.id}`,
          CacheDelDirection.CHILD_TO_PARENT,
        );
      }
    };
    await deleteRecursively(filter);
  }
}
