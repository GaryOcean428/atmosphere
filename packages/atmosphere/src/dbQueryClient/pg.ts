import { ClientType } from 'atmosphere-sdk';
import type { DBQueryClient } from '~/dbQueryClient/types';
import type CustomKnex from '~/db/CustomKnex';
import type { Knex } from '~/db/CustomKnex';
import type { IBaseModelSqlV2 } from '~/db/IBaseModelSqlV2';
import { GenericDBQueryClient } from '~/dbQueryClient/generic';

export class PGDBQueryClient
  extends GenericDBQueryClient
  implements DBQueryClient
{
  get clientType(): ClientType {
    return ClientType.PG;
  }

  concat(fields: string[]) {
    return `CONCAT(${fields.join(', ')})`;
  }

  simpleCast(field: string, asType: string) {
    return `${field}::${asType}`;
  }

  bulkAggregateRowSelector(
    baseModel: IBaseModelSqlV2,
    tQb: Knex.QueryBuilder,
    expressions: Record<string, string>,
    alias: string,
  ): Knex.Raw {
    const knex = baseModel.dbDriver;
    const jsonBuildObject = knex.raw(
      `JSON_BUILD_OBJECT(${Object.keys(expressions)
        .map((k) => `'${k}', ${expressions[k]}`)
        .join(', ')})`,
    );
    tQb.select(jsonBuildObject);
    return knex.raw('(??) as ??', [tQb, alias]);
  }

  replaceDelimitedWithKeyValue(params: {
    knex: CustomKnex;
    stack: { key: string; value: string }[];
    needleColumn: string | Knex.QueryBuilder | Knex.RawBuilder;
    delimiter?: string;
  }): string {
    const delimiter = params.delimiter ?? ',';
    const knex = params.knex;

    if (!params.stack || params.stack.length === 0) {
      return knex.raw(`??`, [params.needleColumn]).toQuery();
    }

    const mapUnion = params.stack
      .map((row) =>
        knex
          .raw(`select ? as atm_p_key, ? as atm_p_value`, [row.key, row.value])
          .toQuery(),
      )
      .join(' UNION ALL ');

    // `WITH ORDINALITY` keeps each id's position in the delimited cell so the
    // `string_agg` below can pin the concatenation order. Without it the
    // aggregate order is whatever the hash join emits — non-deterministic, and
    // it shifts whenever the `stack` (base-user list) changes size/order,
    // silently corrupting User/CreatedBy sort & filter results.
    const needleAsRows = knex
      .raw(
        `select ?? as atm_raw_needle, trim(atm_t_arr.atm_p_needle) as atm_p_needle, atm_t_arr.atm_p_ord as atm_p_ord from unnest(string_to_array(??, '${delimiter}')) with ordinality as atm_t_arr(atm_p_needle, atm_p_ord)`,
        [params.needleColumn, params.needleColumn],
      )
      .toQuery();

    return knex
      .raw(
        [
          `select atm_p_result from (`,
          `  select atm_t_needle.atm_raw_needle, string_agg(coalesce(atm_t_stack.atm_p_value, atm_t_stack.atm_p_key), '${delimiter}' order by atm_t_needle.atm_p_ord) as atm_p_result`,
          `  from (${needleAsRows}) atm_t_needle`,
          `  left join (${mapUnion}) atm_t_stack`,
          `    on atm_t_needle.atm_p_needle = atm_t_stack.atm_p_key`,
          `  group by atm_t_needle.atm_raw_needle`,
          `) atm_subquery`,
        ].join(' '),
      )
      .toQuery();
  }
}
