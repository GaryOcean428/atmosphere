import type { MetaEntityType, MetaEventType, AtContext } from 'atmosphere-sdk';
import type { MetaService } from '~/meta/meta.service';

export const META_DEPENDENCY_MODULE_PROVIDER_KEY = 'META_DEPENDENCY';

export interface AffectedDependencyResult {
  bases?: any[];
  models?: any[];
  filters?: any[];
  columns?: any[];
  views?: any[];
  sorts?: any[];
}

export interface MetaDependencyEventRequest {
  eventType: MetaEventType;
  oldEntity?: any;
  newEntity?: any;
}

export interface MetaEventHandler {
  triggerMetaEvents: MetaEventType[];
  getAffectedDependency(
    context: AtContext,
    param: MetaDependencyEventRequest,
    ncMeta?: MetaService,
  ): Promise<undefined | AffectedDependencyResult>;
  handle(
    context: AtContext,
    param: MetaDependencyEventRequest & {
      affectedDependencyResult: AffectedDependencyResult;
    },
    ncMeta?: MetaService,
  ): Promise<void>;
}

export interface MetaEvent<T> {
  eventType: MetaEventType;
  entityType: MetaEntityType;
  entity: T;
}
