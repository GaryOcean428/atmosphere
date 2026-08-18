import { type AtContext, parseProp } from 'atmosphere-sdk';
import type { LinksColumn } from '~/models';
import { type Column } from '~/models';
import Atmosphere from '~/Atmosphere';

export const getCustomLinkParam = async (
  _context: AtContext,
  {
    col,
  }: { col: Column; colOptions: LinksColumn; mapId?: (id: string) => string },
  _ncMeta = Atmosphere.ncMeta,
) => {
  if (!parseProp(col.meta).custom) {
    return;
  }
};
