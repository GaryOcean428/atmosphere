import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';
import { IEventEmitter } from '~/modules/event-emitter/event-emitter.interface';
import { TelemetryService } from '~/services/telemetry.service';

export const HANDLE_PRIORITY_ERROR = '__nc_handlePriorityError';

@Injectable()
export class TelemetryHandlerService implements OnModuleInit, OnModuleDestroy {
  protected logger = new Logger(TelemetryHandlerService.name);
  protected unsubscribe: () => void;

  static sendPriorityError(
    context: AtContext,
    param: {
      trigger: string;
      error_type?: string;
      message?: string;
      error_details?: string;
      affected_resources?: (string | undefined | null)[];
    },
  ) {
    Atmosphere.eventEmitter.emit(HANDLE_PRIORITY_ERROR, { context, ...param });
  }

  constructor(
    @Inject('IEventEmitter') protected readonly eventEmitter: IEventEmitter,
    protected readonly telemetryService: TelemetryService,
  ) {}

  public async handlePriorityError(
    context: AtContext,
    param: {
      trigger: string;
      error_type?: string;
      message?: string;
      error_details?: string;
      affected_resources?: (string | undefined | null)[];
    },
  ): Promise<void> {
    this.telemetryService.sendSystemEvent({
      event_type: 'priority_error',
      error_trigger: param.trigger,
      error_type: param.error_type,
      message: param.message,
      error_details: param.error_details,
      affected_resources: [
        context.user?.email,
        context.user?.id,
        context.base_id,
        context.workspace_id,
        ...(param.affected_resources ?? []),
      ].filter((v): v is string => !!v),
    });
  }

  onModuleInit(): any {
    this.unsubscribe = this.eventEmitter.on(
      HANDLE_PRIORITY_ERROR,
      async (arg) => {
        try {
          const { context, ...rest } = arg;
          return this.handlePriorityError(context, rest);
        } catch (e) {
          this.logger.error({
            error: e,
            details: 'Error while handle priority error on telemetry service',
          });
        }
      },
    );
  }

  onModuleDestroy() {
    this.unsubscribe?.();
  }
}
