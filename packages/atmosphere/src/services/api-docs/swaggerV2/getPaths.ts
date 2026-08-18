import { getModelPaths } from './templates/paths';
import type { Model, Source } from '~/models';
import type { SwaggerColumn } from './getSwaggerColumnMetas';
import type { SwaggerView } from '~/services/api-docs/shared/swaggerUtils';
import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';

export default async function getPaths(
  context: AtContext,
  {
    model,
    columns,
    views,
    tableName,
  }: {
    model: Model;
    columns: SwaggerColumn[];
    views: SwaggerView[];
    sourcesMap: Map<string, Source>;
    tableName: string;
  },
  _ncMeta = Atmosphere.ncMeta,
) {
  const swaggerPaths = await getModelPaths(context, {
    tableName,
    tableId: model.id,
    views,
    type: model.type,
    columns,
  });

  return swaggerPaths;
}
