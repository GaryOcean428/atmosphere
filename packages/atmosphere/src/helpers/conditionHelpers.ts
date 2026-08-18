import type { AtContext } from 'atmosphere-sdk';
import type Column from '~/models/Column';
import type Filter from '~/models/Filter';

export const handleCurrentUserFilter = (
  _context: AtContext,
  _param: {
    column: Column;
    filter: Filter;
    setVal: (val: string) => void;
  },
) => {};
