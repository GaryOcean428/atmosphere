import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';
import LongTextColumn from '~/models/LongTextColumn';

export default class AIColumn extends LongTextColumn {
  id: string;

  fk_integration_id: string;
  model: string;
  prompt: string;
  prompt_raw: string;
  error?: string;

  public static castType(data: AIColumn): AIColumn {
    return data && new AIColumn(data);
  }

  public static async insert(
    context: AtContext,
    aiColumn: Partial<AIColumn> & {
      fk_model_id: string;
      fk_column_id: string;
    },
    ncMeta = Atmosphere.ncMeta,
  ) {
    return this._insert(
      context,
      aiColumn,
      ['fk_integration_id', 'model', 'prompt', 'prompt_raw', 'error'],
      ncMeta,
    );
  }

  public static async update(
    context: AtContext,
    columnId: string,
    aiColumn: Partial<AIColumn>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    return this._update(
      context,
      columnId,
      aiColumn,
      ['fk_integration_id', 'model', 'prompt', 'prompt_raw', 'error'],
      ncMeta,
    );
  }
}
