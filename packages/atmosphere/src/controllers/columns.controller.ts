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
import { ColumnReqType } from 'atmosphere-sdk';
import type { Column } from '~/models';
import { GlobalGuard } from '~/guards/global/global.guard';
import { ColumnsService } from '~/services/columns.service';
import { Acl } from '~/middlewares/extract-ids/extract-ids.middleware';
import { MetaApiLimiterGuard } from '~/guards/meta-api-limiter.guard';
import { TenantContext } from '~/decorators/tenant-context.decorator';
import { AtContext, AtRequest } from '~/interface/config';

@Controller()
@UseGuards(MetaApiLimiterGuard, GlobalGuard)
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post([
    '/api/v1/db/meta/tables/:tableId/columns/',
    '/api/v2/meta/tables/:tableId/columns/',
  ])
  @HttpCode(200)
  @Acl('columnAdd')
  async columnAdd(
    @TenantContext() context: AtContext,
    @Param('tableId') tableId: string,
    @Body() body: ColumnReqType,
    @Req() req: AtRequest,
  ) {
    return await this.columnsService.columnAdd(context, {
      tableId,
      column: body,
      req,
      user: req.user,
    });
  }

  @Patch([
    '/api/v1/db/meta/columns/:columnId',
    '/api/v2/meta/columns/:columnId',
  ])
  @Acl('columnUpdate')
  async columnUpdate(
    @TenantContext() context: AtContext,
    @Param('columnId') columnId: string,
    @Body() body: ColumnReqType,
    @Req() req: AtRequest,
  ) {
    return await this.columnsService.columnUpdate(context, {
      columnId: columnId,
      column: body,
      req,
      user: req.user,
    });
  }

  @Delete([
    '/api/v1/db/meta/columns/:columnId',
    '/api/v2/meta/columns/:columnId',
  ])
  @Acl('columnDelete')
  async columnDelete(
    @TenantContext() context: AtContext,
    @Param('columnId') columnId: string,
    @Req() req: AtRequest,
  ) {
    return await this.columnsService.columnDelete(context, {
      columnId,
      req,
    });
  }

  @Get(['/api/v1/db/meta/columns/:columnId', '/api/v2/meta/columns/:columnId'])
  @Acl('columnGet')
  async columnGet(
    @TenantContext() context: AtContext,
    @Param('columnId') columnId: string,
  ) {
    return await this.columnsService.columnGet(context, { columnId });
  }

  @Post([
    '/api/v1/db/meta/columns/:columnId/primary',
    '/api/v2/meta/columns/:columnId/primary',
  ])
  @HttpCode(200)
  @Acl('columnSetAsPrimary')
  async columnSetAsPrimary(
    @TenantContext() context: AtContext,
    @Param('columnId') columnId: string,
    @Req() req: AtRequest,
  ) {
    return await this.columnsService.columnSetAsPrimary(context, {
      columnId,
      req,
    });
  }

  @Get([
    '/api/v1/db/meta/tables/:tableId/columns/hash',
    '/api/v2/meta/tables/:tableId/columns/hash',
  ])
  @Acl('columnsHash')
  async columnsHash(
    @TenantContext() context: AtContext,
    @Param('tableId') tableId: string,
  ) {
    return await this.columnsService.columnsHash(context, tableId);
  }

  @Post([
    '/api/v1/db/meta/tables/:tableId/columns/bulk',
    '/api/v2/meta/tables/:tableId/columns/bulk',
  ])
  @HttpCode(200)
  @Acl('columnBulk')
  async columnBulk(
    @TenantContext() context: AtContext,
    @Param('tableId') tableId: string,
    @Body()
    body: {
      hash: string;
      ops: {
        op: 'add' | 'update' | 'delete';
        column: Partial<Column>;
      }[];
    },
    @Req() req: AtRequest,
  ) {
    return await this.columnsService.columnsBulk(context, {
      tableId,
      hash: body.hash,
      ops: body.ops,
      req,
    });
  }
}
