import { generateSwagger } from '../shared/swaggerUtils';
import swaggerBase from './swagger-base-v3.json';
import getPathsV3 from './getPathsV3';
import getSchemasV3 from './getSchemasV3';
import getSwaggerColumnMetasV3 from './getSwaggerColumnMetasV3';
import type { SourcesMap } from '~/services/api-docs/types';
import type { Base, Model } from '~/models';
import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';

export default async function getSwaggerJSONV3(
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
    getSwaggerColumnMetasV3,
    getPathsV3,
    getSchemasV3,
  );
}
