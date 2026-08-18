import { UnifiedMetaType } from '~/lib/types';
import { AtContext } from '../ncTypes';

export const getParsedTree = async (
  _context: AtContext,
  {
    colOptions,
  }: {
    colOptions: UnifiedMetaType.IFormulaColumn;
    getMeta: UnifiedMetaType.IGetModel;
  }
) => {
  if (!colOptions) {
    return undefined;
  }
  if ('getParsedTree' in colOptions) {
    return colOptions.getParsedTree();
  } else {
    return colOptions.parsed_tree;
  }
};
