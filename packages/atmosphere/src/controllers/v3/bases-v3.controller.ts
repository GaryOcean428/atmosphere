import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BaseCreateV3Type, BaseUpdateV3Type } from 'atmosphere-sdk';
import { GlobalGuard } from '~/guards/global/global.guard';
import { Acl } from '~/middlewares/extract-ids/extract-ids.middleware';
import { MetaApiLimiterGuard } from '~/guards/meta-api-limiter.guard';
import { TenantContext } from '~/decorators/tenant-context.decorator';
import { AtContext, AtRequest } from '~/interface/config';
import { BasesV3Service } from '~/services/v3/bases-v3.service';
import { isEE } from '~/utils';

// decide scope based on whether it's EE or CE
const BASE_SCOPE = isEE ? 'workspace' : 'org';

@UseGuards(MetaApiLimiterGuard, GlobalGuard)
@Controller()
export class BasesV3Controller {
  constructor(protected readonly baseV3Service: BasesV3Service) {}

  // decide permission name based on whether it's EE or CE
  @Acl(isEE ? 'workspaceBaseList' : 'baseList', {
    scope: BASE_SCOPE,
  })
  @Get('/api/v3/meta/workspaces/:workspaceId/bases')
  async list(
    @TenantContext() context: AtContext,
    @Query() queryParams: Record<string, any>,
    @Req() req: AtRequest,
    @Param('workspaceId') workspaceId: string,
  ) {
    const bases = await this.baseV3Service.baseList(context, {
      user: req.user,
      query: queryParams,
      workspaceId,
      req,
    });
    return { list: bases };
  }

  @Acl('baseGet')
  @Get('/api/v3/meta/bases/:baseId')
  async baseGet(
    @TenantContext() context: AtContext,
    @Param('baseId') baseId: string,
    @Query('include') qsInclude?: string[],
  ) {
    const base = await this.baseV3Service.getProjectWithInfo(context, {
      baseId: baseId,
      qsInclude,
      includeConfig: false,
    });

    return base;
  }

  @Acl('baseUpdate')
  @Patch('/api/v3/meta/bases/:baseId')
  async baseUpdate(
    @TenantContext() context: AtContext,
    @Param('baseId') baseId: string,
    @Body() body: BaseUpdateV3Type,
    @Req() req: AtRequest,
  ) {
    const base = await this.baseV3Service.baseUpdate(context, {
      baseId,
      base: body,
      user: req.user,
      req,
    });

    return base;
  }

  @Acl('baseDelete')
  @Delete('/api/v3/meta/bases/:baseId')
  async baseDelete(
    @TenantContext() context: AtContext,
    @Param('baseId') baseId: string,
    @Req() req: AtRequest,
  ) {
    const deleted = await this.baseV3Service.baseSoftDelete(context, {
      baseId,
      user: req.user,
      req,
    });

    return deleted;
  }

  @Acl('baseCreate', {
    scope: BASE_SCOPE,
  })
  @HttpCode(200)
  @Post('/api/v3/meta/workspaces/:workspaceId/bases')
  async baseCreate(
    @TenantContext() context: AtContext,
    @Body() baseBody: BaseCreateV3Type,
    @Req() req: AtRequest,
    @Param('workspaceId') workspaceId: string,
  ) {
    const base = await this.baseV3Service.baseCreate({
      base: baseBody,
      req,
      user: req['user'],
      workspaceId,
    });

    return base;
  }
}
