import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ViewTypes } from 'atmosphere-sdk';
import type { DataExportJobData } from '~/interface/Jobs';
import { BasesService } from '~/services/bases.service';
import { PublicDatasService } from '~/services/public-datas.service';
import { View } from '~/models';
import { JobTypes } from '~/interface/Jobs';
import { IJobsService } from '~/modules/jobs/jobs-service.interface';
import { TenantContext } from '~/decorators/tenant-context.decorator';
import { AtContext, AtRequest } from '~/interface/config';
import { AtError } from '~/helpers/catchError';
import { PublicApiLimiterGuard } from '~/guards/public-api-limiter.guard';

@Controller()
@UseGuards(PublicApiLimiterGuard)
export class PublicDataExportController {
  constructor(
    @Inject('JobsService') protected readonly jobsService: IJobsService,
    protected readonly basesService: BasesService,
    protected readonly publicDatasService: PublicDatasService,
  ) {}

  @Post(['/api/v2/public/export/:publicDataUuid/:exportAs'])
  @HttpCode(200)
  async exportModelData(
    @TenantContext() context: AtContext,
    @Req() req: AtRequest,
    @Param('publicDataUuid') publicDataUuid: string,
    @Param('exportAs') exportAs: 'csv' | 'json' | 'excel' | 'ics',
    @Body() options: DataExportJobData['options'],
  ) {
    const view = await View.getByUUID(context, publicDataUuid);

    if (!view) AtError.viewNotFound(publicDataUuid);
    if (view.type === ViewTypes.FORM) AtError.notFound('Not found');

    if (
      !(await View.verifyPassword(view, req.headers?.['xc-password'] as string))
    ) {
      AtError.invalidSharedViewPassword();
    }

    // check if download is allowed
    if (!view.meta?.allowCSVDownload) {
      AtError.forbidden('Download is not allowed for this view');
    }

    if (!view) AtError.viewNotFound(publicDataUuid);

    const job = await this.jobsService.add(JobTypes.DataExport, {
      context,
      options: {
        ...(options ?? {}),
        // includeByteOrderMark when export is triggered from controller
        includeByteOrderMark: true,
        // Anonymous export: the ICS description otherwise builds from all model
        // columns, including view-hidden ones.
        isPublicExport: true,
      },
      modelId: view.fk_model_id,
      viewId: view.id,
      user: req.user,
      exportAs,
      ncSiteUrl: req.ncSiteUrl,
      locale:
        (req.headers?.['accept-language'] || '').split(',')[0] || undefined,
    });

    return {
      id: job.id,
    };
  }
}
