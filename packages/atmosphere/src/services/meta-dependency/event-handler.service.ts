import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  META_DEPENDENCY_MODULE_PROVIDER_KEY,
  type MetaDependencyEventRequest,
  type MetaEventHandler,
} from './types';
import type { OnModuleInit, Type } from '@nestjs/common';
import type { MetaEventType, AtContext } from 'atmosphere-sdk';
import type { MetaService } from '~/meta/meta.service';
import Atmosphere from '~/Atmosphere';

@Injectable()
export class MetaDependencyEventHandler implements OnModuleInit {
  constructor(
    @Inject(META_DEPENDENCY_MODULE_PROVIDER_KEY)
    protected readonly metaEventHandlerClasses: Type<MetaEventHandler>[],
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.registerEvents(
      this.metaEventHandlerClasses.map((cls) =>
        this.moduleRef.get(cls, { strict: false }),
      ),
    );
  }

  metaEventHandlerMap: Record<MetaEventType, MetaEventHandler[]> = {
    COLUMN_ADDED: [],
    COLUMN_DELETED: [],
    COLUMN_UPDATED: [],
    HOOK_DELETED: [],
    FILTER_CREATED: [],
    FILTER_UPDATED: [],
    FILTER_DELETED: [],
    VIEW_UPDATED: [],
    VIEW_DELETED: [],
    TABLE_DELETED: [],
  };

  registerEvents(metaEventHandler: MetaEventHandler[]) {
    for (const each of metaEventHandler) {
      if (!each || !Array.isArray(each.triggerMetaEvents)) {
        new Logger(MetaDependencyEventHandler.name).error(
          `Skipping meta-dependency handler with invalid triggerMetaEvents: ${
            (each as any)?.constructor?.name ?? String(each)
          }`,
        );
        continue;
      }
      for (const eachType of each.triggerMetaEvents) {
        this.metaEventHandlerMap[eachType] =
          this.metaEventHandlerMap[eachType] ?? [];
        this.metaEventHandlerMap[eachType].push(each);
      }
    }
  }

  async handleEvent(
    context: AtContext,
    param: MetaDependencyEventRequest,
    ncMeta = Atmosphere.ncMeta,
  ) {
    // if suppressed, do not make further evaluation
    if (context.suppressDependencyEvaluation) {
      return;
    }
    // next context will have suppressDependencyEvaluation as true by default unless modules override it.
    const nextContext = {
      ...context,
      suppressDependencyEvaluation: true,
    } as AtContext;
    let trxNcMeta: MetaService;
    try {
      for (const handler of this.metaEventHandlerMap[param.eventType] ?? []) {
        const affectedDependencies = await handler.getAffectedDependency(
          nextContext,
          param,
          trxNcMeta ?? ncMeta,
        );
        if (affectedDependencies) {
          trxNcMeta = trxNcMeta ?? (await ncMeta.startTransaction());
          await handler.handle(
            nextContext,
            {
              ...param,
              affectedDependencyResult: affectedDependencies,
            },
            trxNcMeta,
          );
        }
      }
      await trxNcMeta?.commit();
    } catch (ex) {
      await trxNcMeta?.rollback();
      throw ex;
    }
  }
}
