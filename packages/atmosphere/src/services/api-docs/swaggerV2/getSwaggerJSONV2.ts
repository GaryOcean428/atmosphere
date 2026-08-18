import { generateSwagger } from '../shared/swaggerUtils';
import swaggerBase from './swagger-base.json';
import getPaths from './getPaths';
import getSchemas from './getSchemas';
import getSwaggerColumnMetas from './getSwaggerColumnMetas';
import type { Base, Model } from '~/models';
import type { AtContext } from '~/interface/config';
import type { SourcesMap } from '~/services/api-docs/types';
import Atmosphere from '~/Atmosphere';

export default async function getSwaggerJSONV2(
  context: AtContext,
  {
    base,
    sourcesMap,
    models,
  }: {
    base: Base;
    sourcesMap: SourcesMap;
    models: Model[];
  },
  ncMeta = Atmosphere.ncMeta,
) {
  return generateSwagger(
    { context, base, models, sourcesMap, ncMeta },
    swaggerBase,
    getSwaggerColumnMetas,
    getPaths,
    getSchemas,
  );
}
