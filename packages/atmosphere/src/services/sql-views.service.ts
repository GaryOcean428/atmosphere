import { Injectable } from '@nestjs/common';
import { ModelTypes } from 'atmosphere-sdk';
import DOMPurify from 'isomorphic-dompurify';
import type { UserType } from 'atmosphere-sdk';
import type { AtContext } from '~/interface/config';
import { AtError } from '~/helpers/catchError';
import getTableNameAlias, { getColumnNameAlias } from '~/helpers/getTableName';
import ProjectMgrv2 from '~/db/sql-mgr/v2/ProjectMgrv2';
import mapDefaultDisplayValue from '~/helpers/mapDefaultDisplayValue';
import getColumnUiType from '~/helpers/getColumnUiType';
import AtConnectionMgrv2 from '~/utils/common/AtConnectionMgrv2';
import { Base, Column, Model } from '~/models';

@Injectable()
export class SqlViewsService {
  async sqlViewCreate(
    context: AtContext,
    param: {
      clientIp: string;
      baseId: string;
      sourceId: string;
      body: {
        view_name: string;
        title: string;
        view_definition?: string;
      };
      user: UserType;
    },
  ) {
    AtError.notImplemented();
    return;
    const body = { ...param.body };

    const base = await Base.getWithInfo(context, param.baseId);
    let source = base.sources[0];

    if (param.sourceId) {
      source = base.sources.find((b) => b.id === param.sourceId);
    }

    if (!body.view_name || (base.prefix && base.prefix === body.view_name)) {
      AtError.badRequest(
        'Missing table name `view_name` property in request body',
      );
    }

    if (source.is_meta && base.prefix) {
      if (!body.view_name.startsWith(base.prefix)) {
        body.view_name = `${base.prefix}_${body.view_name}`;
      }
    }

    body.view_name = DOMPurify.sanitize(body.view_name);

    // validate table name
    if (/^\s+|\s+$/.test(body.view_name)) {
      AtError.badRequest(
        'Leading or trailing whitespace not allowed in table names',
      );
    }

    if (
      !(await Model.checkTitleAvailable(context, {
        table_name: body.view_name,
        base_id: base.id,
        source_id: source.id,
      }))
    ) {
      AtError.badRequest('Duplicate table name');
    }

    if (!body.title) {
      body.title = getTableNameAlias(body.view_name, base.prefix, source);
    }

    if (
      !(await Model.checkAliasAvailable(context, {
        title: body.title,
        base_id: base.id,
        source_id: source.id,
      }))
    ) {
      AtError.badRequest('Duplicate table alias');
    }

    const sqlMgr = await ProjectMgrv2.getSqlMgr(context, base);

    const sqlClient = await AtConnectionMgrv2.getSqlClient(source);

    let tableNameLengthLimit = 255;
    const sqlClientType = sqlClient.knex.clientType();
    if (sqlClientType === 'mysql2' || sqlClientType === 'mysql') {
      tableNameLengthLimit = 64;
    } else if (sqlClientType === 'pg') {
      tableNameLengthLimit = 63;
    } else if (sqlClientType === 'mssql') {
      tableNameLengthLimit = 128;
    }

    if (body.view_name.length > tableNameLengthLimit) {
      AtError.badRequest(
        `Table name exceeds ${tableNameLengthLimit} characters`,
      );
    }

    // TODO - reimplement this
    await sqlMgr.sqlOpPlus(source, 'viewCreate', {
      view_name: body.view_name,
      view_definition: body.view_definition,
    });

    const columns: Array<
      Omit<Column, 'column_name' | 'title'> & {
        cn: string;
        system?: boolean;
      }
    > = (
      await sqlClient.columnList({
        tn: body.view_name,
        schema: source.getConfig()?.schema,
      })
    )?.data?.list;

    const tables = await Model.list(context, {
      base_id: base.id,
      source_id: source.id,
    });

    mapDefaultDisplayValue(columns);

    const model = await Model.insert(context, base.id, source.id, {
      table_name: body.view_name,
      title: getTableNameAlias(body.view_name, base.prefix, source),
      type: ModelTypes.VIEW,
      order: +(tables?.pop()?.order ?? 0) + 1,
      user_id: param.user.id,
    });

    let colOrder = 1;

    for (const column of columns) {
      await Column.insert(context, {
        fk_model_id: model.id,
        ...column,
        title: getColumnNameAlias(column.cn, source),
        order: colOrder++,
        uidt: getColumnUiType(source, column),
      });
    }

    return await Model.get(context, model.id);
  }
}
