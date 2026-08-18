import type { CalendarRangeType } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import { CacheDelDirection, CacheScope, MetaTable } from '~/utils/globals';

export default class CalendarRange implements CalendarRangeType {
  id?: string;
  fk_from_column_id?: string;
  fk_workspace_id?: string;
  base_id?: string;
  fk_view_id?: string;

  constructor(data: Partial<CalendarRange>) {
    Object.assign(this, data);
  }

  public static async bulkInsert(
    context: AtContext,
    data: Partial<CalendarRange>[],
    ncMeta = Atmosphere.ncMeta,
  ) {
    const calRanges: {
      fk_from_column_id?: string;
      fk_view_id?: string;
    }[] = [];

    for (const d of data) {
      const tempObj = extractProps(d, ['fk_from_column_id', 'fk_view_id']);
      calRanges.push(tempObj);
    }

    if (!calRanges.length) return false;

    const insertObj = calRanges[0];

    const insertData = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.CALENDAR_VIEW_RANGE,
      insertObj,
    );

    await AtmosphereCache.deepDel(
      context,
      `${CacheScope.CALENDAR_VIEW_RANGE}:${insertData.fk_view_id}:list`,
      CacheDelDirection.PARENT_TO_CHILD,
    );

    await AtmosphereCache.set(
      context,
      `${CacheScope.CALENDAR_VIEW_RANGE}:${insertData.id}`,
      insertData,
    );

    await AtmosphereCache.appendToList(
      context,
      CacheScope.CALENDAR_VIEW_RANGE,
      [insertData.fk_view_id],
      `${CacheScope.CALENDAR_VIEW_RANGE}:${insertData.id}`,
    );

    return true;
  }

  public static async read(
    context: AtContext,
    fk_view_id: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const cachedList = await AtmosphereCache.getList(
      context,
      CacheScope.CALENDAR_VIEW_RANGE,
      [fk_view_id],
    );
    let { list: ranges } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !ranges.length) {
      ranges = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.CALENDAR_VIEW_RANGE,
        { condition: { fk_view_id } },
      );
      await AtmosphereCache.setList(
        context,
        CacheScope.CALENDAR_VIEW_RANGE,
        [fk_view_id],
        ranges.map(({ created_at, updated_at, ...others }) => others),
      );
    }

    return ranges?.length
      ? {
          ranges: ranges.map(
            ({ created_at, updated_at, ...c }) => new CalendarRange(c),
          ),
        }
      : null;
  }

  public static async delete(
    rangeId: string,
    context: AtContext,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const range = await ncMeta.metaGet2(
      context.workspace_id,
      context.base_id,
      MetaTable.CALENDAR_VIEW_RANGE,
      {
        id: rangeId,
      },
    );

    if (!range) return false;

    await ncMeta.metaDelete(
      context.workspace_id,
      context.base_id,
      MetaTable.CALENDAR_VIEW_RANGE,
      rangeId,
    );

    await AtmosphereCache.deepDel(
      context,
      `${CacheScope.CALENDAR_VIEW_RANGE}:${range.fk_view_id}:list`,
      CacheDelDirection.PARENT_TO_CHILD,
    );

    await AtmosphereCache.del(
      context,
      `${CacheScope.CALENDAR_VIEW_RANGE}:${rangeId}`,
    );

    return true;
  }

  public static async find(
    context: AtContext,
    fk_view_id: string,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<CalendarRange> {
    const data = await ncMeta.metaGet2(
      context.workspace_id,
      context.base_id,
      MetaTable.CALENDAR_VIEW_RANGE,
      {
        fk_view_id,
      },
    );

    return data && new CalendarRange(data);
  }

  public static async IsColumnBeingUsedAsRange(
    context: AtContext,
    columnId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    return await ncMeta.metaList2(
      context.workspace_id,
      context.base_id,
      MetaTable.CALENDAR_VIEW_RANGE,
      {
        xcCondition: {
          _or: [
            {
              fk_from_column_id: {
                eq: columnId,
              },
            },
          ],
        },
      },
    );
  }
}
