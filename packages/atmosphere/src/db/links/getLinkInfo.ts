import { unifiedMeta } from 'atmosphere-sdk';
import type { AtContext } from 'atmosphere-sdk';
import type { Column } from '~/models';
import { Model } from '~/models';

export const getLinkInfo = async (
  context: AtContext,
  {
    model,
    column,
  }: {
    model: Model;
    column: Column;
  },
) => {
  return unifiedMeta.getLinkInfo(context, {
    sourceModel: model,
    linkColumn: column,
    getMeta: async (context: AtContext, { id }: { id: string }) =>
      Model.get(context, id),
  });
};
