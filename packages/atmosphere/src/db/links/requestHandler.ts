import { type AtContext } from 'atmosphere-sdk';
import type CustomKnex from '~/db/CustomKnex';
import type { LinkUnlinkRequest } from '~/db/links/types';
import { getBaseModelSqlFromModelId } from '~/helpers/dbHelpers';
import { Column, Model } from '~/models';

export class LinksRequestHandler {
  async validateLinkRequest(
    _context: AtContext,
    payload: LinkUnlinkRequest,
    _knex: CustomKnex,
  ) {
    return payload;
  }

  async generateLinkRequest(
    context: AtContext,
    payload: Omit<LinkUnlinkRequest, 'unlinks'> & { replaceMode?: boolean },
    _knex?: CustomKnex,
  ) {
    const column =
      payload.column ??
      (await Column.get(context, { colId: payload.columnId }));
    const model = payload.model ?? (await Model.get(context, payload.modelId));
    const colOptions =
      payload.colOptions ?? (await column.getColOptions(context));

    const baseModel =
      payload.baseModel ??
      (await getBaseModelSqlFromModelId({
        modelId: payload.modelId,
        context,
      }));
    return {
      ...payload,
      colOptions,
      baseModel,
      column,
      model,
    };
  }

  async handle(
    _context: AtContext,
    _payload: LinkUnlinkRequest,
    _knex?: CustomKnex,
  ) {}
}
