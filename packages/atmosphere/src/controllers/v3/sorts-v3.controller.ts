import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SortCreateV3Type, SortUpdateV3Type } from 'atmosphere-sdk';
import { GlobalGuard } from '~/guards/global/global.guard';
import { Acl } from '~/middlewares/extract-ids/extract-ids.middleware';
import { MetaApiLimiterGuard } from '~/guards/meta-api-limiter.guard';
import { TenantContext } from '~/decorators/tenant-context.decorator';
import { AtContext, AtRequest } from '~/interface/config';
import { SortsV3Service } from '~/services/v3/sorts-v3.service';
import { PREFIX_APIV3_METABASE } from '~/constants/controllers';

@Controller()
@UseGuards(MetaApiLimiterGuard, GlobalGuard)
export class SortsV3Controller {
  constructor(private readonly sortsV3Service: SortsV3Service) {}

  @Get([
    `${PREFIX_APIV3_METABASE}/tables/:tableId/views/:viewId/sorts`,
    `${PREFIX_APIV3_METABASE}/views/:viewId/sorts`,
  ])
  @Acl('sortList')
  async sortList(
    @TenantContext() context: AtContext,
    @Param('viewId') viewId: string,
  ) {
    return {
      list: await this.sortsV3Service.sortList(context, {
        viewId,
      }),
    };
  }

  @Post([
    `${PREFIX_APIV3_METABASE}/tables/:tableId/views/:viewId/sorts`,
    `${PREFIX_APIV3_METABASE}/views/:viewId/sorts`,
  ])
  @HttpCode(200)
  @Acl('sortCreate')
  async sortCreate(
    @TenantContext() context: AtContext,
    @Param('viewId') viewId: string,
    @Body() body: SortCreateV3Type,
    @Req() req: AtRequest,
  ) {
    const sort = await this.sortsV3Service.sortCreate(context, {
      sort: body,
      viewId,
      req,
    });
    return sort;
  }

  @Patch([
    `${PREFIX_APIV3_METABASE}/tables/:tableId/views/:viewId/sorts`,
    `${PREFIX_APIV3_METABASE}/views/:viewId/sorts`,
  ])
  @Acl('sortUpdate')
  async sortUpdate(
    @TenantContext() context: AtContext,
    @Body() body: SortUpdateV3Type,
    @Param('viewId') viewId: string,
    @Req() req: AtRequest,
  ) {
    const sort = await this.sortsV3Service.sortUpdate(context, {
      sortId: body.id,
      sort: body,
      req,
      viewId,
    });
    return sort;
  }

  @Delete([
    `${PREFIX_APIV3_METABASE}/tables/:tableId/views/:viewId/sorts`,
    `${PREFIX_APIV3_METABASE}/views/:viewId/sorts`,
  ])
  @Acl('sortDelete')
  async sortDelete(
    @TenantContext() context: AtContext,
    @Body() body: { id: string },
    @Req() req: AtRequest,
    @Param('viewId') viewId: string,
  ) {
    await this.sortsV3Service.sortDelete(context, {
      viewId,
      sortId: body.id,
      req,
    });
    return {};
  }
}
