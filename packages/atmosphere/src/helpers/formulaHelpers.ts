import { formulaJsep, UITypes } from 'atmosphere-sdk';
import type FormulaColumn from '../models/FormulaColumn';
import type { AtContext } from '~/interface/config';
import type { ButtonColumn, Column } from '~/models';
import Atmosphere from '~/Atmosphere';

export async function getFormulasReferredTheColumn(
  context: AtContext,
  {
    column,
    columns,
  }: {
    column: Column;
    columns: Column[];
  },
  ncMeta = Atmosphere.ncMeta,
): Promise<Column[]> {
  const fn = (pt) => {
    if (pt.type === 'CallExpression') {
      return pt.arguments.some((arg) => fn(arg));
    } else if (pt.type === 'Literal') {
    } else if (pt.type === 'Identifier') {
      return [column.id, column.title].includes(pt.name);
    } else if (pt.type === 'BinaryExpression') {
      return fn(pt.left) || fn(pt.right);
    }
  };

  return columns.reduce(async (columnsPromise, c) => {
    const columns = await columnsPromise;
    if (c.uidt !== UITypes.Formula && c.uidt !== UITypes.Button) return columns;

    const formula = await c.getColOptions<FormulaColumn | ButtonColumn>(
      context,
      ncMeta,
    );

    if (UITypes.Button === c.uidt && (formula as ButtonColumn)?.type !== 'url')
      return columns;

    if (formula.formula && fn(formulaJsep(formula.formula))) {
      columns.push(c);
    }
    return columns;
  }, Promise.resolve([]));
}
