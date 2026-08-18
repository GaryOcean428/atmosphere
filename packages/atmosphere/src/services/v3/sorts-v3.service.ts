import { Injectable } from '@nestjs/common';
import type {
  SortCreateV3Type,
  SortReqType,
  SortType,
  SortUpdateV3Type,
} from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { type ViewWebhookManager } from '~/utils/view-webhook-manager';
import { Column, Sort } from '~/models';
import { SortsService } from '~/services/sorts.service';
import {
  builderGenerator,
  sortBuilder,
} from '~/utils/api-v3-data-transformation.builder';
import { AtError } from '~/helpers/catchError';
import { validatePayload } from '~/helpers';
import Atmosphere from '~/Atmosphere';

@Injectable()
export class SortsV3Service {
  private revBuilder = builderGenerator<
    SortCreateV3Type | SortUpdateV3Type,
    SortType
  >({
    allowed: ['id', 'field_id', 'direction', 'enabled'],
    mappings: {
      field_id: 'fk_column_id',
    },
  });

  constructor(protected readonly sortsService: SortsService) {}

  async sortGet(context: AtContext, param: { sortId: string }) {
    return sortBuilder().build(await this.sortsService.sortGet(context, param));
  }

  async sortDelete(
    context: AtContext,
    param: {
      viewId: string;
      sortId: string;
      req: AtRequest;
      viewWebhookManager?: ViewWebhookManager;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const sort = await Sort.get(context, param.sortId ?? '', ncMeta);

    if (!sort || sort.fk_view_id !== param.viewId) {
      AtError.notFound('Sort not found');
    }

    // Pass only the keys the v2 sortDelete consumes. `viewId` isn't used there
    // (the sort is resolved by id) and isn't in the strict sortDelete command
    // schema, so leaking it would pollute / silently drop the sandbox changelog
    // entry on a sandbox base.
    await this.sortsService.sortDelete(
      context,
      {
        sortId: param.sortId,
        req: param.req,
        viewWebhookManager: param.viewWebhookManager,
      },
      ncMeta,
    );
    return {};
  }

  async sortUpdate(
    context: AtContext,
    param: {
      sortId: string;
      sort: SortUpdateV3Type;
      req: AtRequest;
      viewId: string;
      viewWebhookManager?: ViewWebhookManager;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    validatePayload(
      'swagger-v3.json#/components/schemas/SortUpdate',
      param.sort,
      true,
    );

    let sort;

    if (param.sortId) {
      sort = await Sort.get(context, param.sortId, ncMeta);
    } else {
      const sorts = await Sort.list(context, { viewId: param.viewId }, ncMeta);
      sort = sorts.find((s) => s.fk_column_id === param.sort.field_id);
    }

    if (!sort || sort.fk_view_id !== param.viewId) {
      AtError.notFound('Sort not found');
    }

    if (param.sort.field_id) {
      const column = await Column.get(
        context,
        { colId: param.sort.field_id },
        ncMeta,
      );
      if (column?.colOptions?.error) {
        AtError.get(context).badRequest(
          `Cannot use column '${column.title}' in sort: ${column.colOptions.error}`,
        );
      }
    }

    const updateObj = this.revBuilder().build(param.sort);
    // Build the v2 payload explicitly rather than spreading `...param`: `viewId`
    // (and any other V3-only key) isn't consumed by sortUpdate and isn't in the
    // strict sortUpdate command schema, so spreading it would pollute / silently
    // drop the sandbox changelog entry on a sandbox base.
    await this.sortsService.sortUpdate(
      context,
      {
        sortId: sort.id,
        sort: updateObj as SortReqType,
        req: param.req,
        viewWebhookManager: param.viewWebhookManager,
      },
      ncMeta,
    );
    return this.sortGet(context, param);
  }

  async sortCreate(
    context: AtContext,
    param: {
      viewId: string;
      sort: SortCreateV3Type;
      req: AtRequest;
      viewWebhookManager?: ViewWebhookManager;
      fkLevelId?: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    validatePayload(
      'swagger-v3.json#/components/schemas/SortCreate',
      param.sort,
      true,
      context,
    );

    // check for existing sort with same field. For list views the same table
    // can appear at multiple levels, so scope the check to the level when
    // `fkLevelId` is set — a column may be sorted once per level.
    const sorts = await Sort.list(context, { viewId: param.viewId }, ncMeta);
    const existingSort = sorts.find(
      (s) =>
        s.fk_column_id === param.sort.field_id &&
        (param.fkLevelId ? s.fk_level_id === param.fkLevelId : true),
    );
    if (existingSort) {
      AtError.get(context).invalidRequestBody(
        'Sort already exists for this field',
      );
    }

    // check column exists
    const column = await Column.get(
      context,
      { colId: param.sort.field_id },
      ncMeta,
    );

    if (!column) {
      AtError.get(context).notFound('Column not found');
    }

    if (column.colOptions?.error) {
      AtError.get(context).badRequest(
        `Cannot use column '${column.title}' in sort: ${column.colOptions.error}`,
      );
    }

    const builtSort = this.revBuilder().build(param.sort) as SortReqType;
    if (param.fkLevelId) {
      (builtSort as any).fk_level_id = param.fkLevelId;
    }
    const sort = await this.sortsService.sortCreate(
      context,
      {
        viewId: param.viewId,
        sort: builtSort,
        req: param.req,
        viewWebhookManager: param.viewWebhookManager,
      },
      ncMeta,
    );
    return sortBuilder().build(sort);
  }

  async sortList(
    context: AtContext,
    param: { viewId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    return sortBuilder().build(
      await Sort.list(context, { viewId: param.viewId }, ncMeta),
    ) as SortType[];
  }

  /** Sorts scoped to a single list level (`fk_level_id`). */
  async sortListByLevel(
    context: AtContext,
    param: { viewId: string; levelId: string },
    ncMeta = Atmosphere.ncMeta,
  ) {
    const sorts = (
      await Sort.list(context, { viewId: param.viewId }, ncMeta)
    ).filter((s) => (s as any).fk_level_id === param.levelId);
    return sortBuilder().build(sorts) as SortType[];
  }
}
