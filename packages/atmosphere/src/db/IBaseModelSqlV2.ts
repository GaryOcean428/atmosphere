import type BigNumber from 'bignumber.js';
import type {
  XcFilter,
  XcFilterWithAlias,
} from './sql-data-mapper/lib/BaseModel';
import type { XKnex } from '~/db/CustomKnex';
import type {
  AuditV1OperationTypes,
  BulkAuditV1OperationTypes,
  FilterType,
  AtApiVersion,
  AtContext,
  AtRequest,
  PermissionEntity,
  PermissionKey,
  RelationTypes,
} from 'atmosphere-sdk';
import type { Knex } from 'knex';
import type CustomKnex from '~/db/CustomKnex';
import type { Column, Filter, Model, Sort, Source, View } from '~/models';
import type {
  NestedLinkAuditEntry,
  NestedLinkLastModifiedEntry,
} from '~/db/BaseModelSqlv2/nested-link-preparator';
import type { ExecAndParseOptions } from 'src/db/BaseModelSqlv2';
import type { DisplacedRecord } from '~/command-registry/types';
import type PQueue from 'p-queue';

export interface IBaseModelSqlV2 {
  context: AtContext;
  model: Model;
  tnPath: string | Knex.Raw<any>;
  queryQueue: PQueue;

  readByPk(
    id: undefined | any,
    validateFormula: boolean,
    query: any,
    options: {
      ignoreView?: boolean;
      getHiddenColumn?: boolean;
      throwErrorIfInvalidParams?: boolean;
      extractOnlyPrimaries?: boolean;
      apiVersion?: AtApiVersion;
      extractOrderColumn?: boolean;
    },
  ): Promise<any>;
  execAndParse(
    qb: Knex.QueryBuilder | string,
    dependencyColumns: Column[] | undefined | null,
    options: ExecAndParseOptions & { first: true },
  ): Promise<Record<string, any>>;
  execAndParse(
    qb: Knex.QueryBuilder | string,
    dependencyColumns?: Column[] | null,
    options?: ExecAndParseOptions,
  ): Promise<Record<string, any>[]>;

  prepareAtmosphereData(
    data,
    isInsertData,
    cookie?: { user?: any; system?: boolean },
    // oldData uses title as key whereas data uses column_name as key
    oldData?,
    extra?: {
      raw?: boolean;
      ncOrder?: BigNumber;
      before?: string;
      undo?: boolean;
      allowSystemColumn?: boolean;
      // Consumed by the EE override to skip per-field edit-permission checks
      // on trusted internal data-load paths (duplication / snapshot / import).
      skipPermissionCheck?: boolean;
      // Skip the attachment ownership check on those same trusted paths.
      skipAttachmentOwnershipCheck?: boolean;
    },
  ): Promise<void>;

  extractCompositePK({
    ai,
    ag,
    rowId,
    insertObj,
    force,
  }: {
    ai: Column<any>;
    ag: Column<any>;
    rowId;
    insertObj: Record<string, any>;
    force?: boolean;
  }): any;

  updateLastModified(payload: {
    rowIds: any | any[];
    cookie?: { user?: any };
    model?: Model;
    knex?: XKnex;
    baseModel?: IBaseModelSqlV2;
    updatedColIds: string[];
    timestamp?: string;
  }): Promise<void>;
  readOnlyPrimariesByPkFromModel(
    props: {
      model: Model;
      id: any;
      extractDisplayValueData?: boolean;
      displayColumn?: Column;
    }[],
  ): Promise<any[]>;
  fetchDisplayValueMap(
    props: { model: Model; id: any; displayColumn?: Column }[],
  ): Promise<Map<string, any>>;
  getLtarDisplayColumnOverride(
    ltarColumn: Column,
    model: Model,
  ): Promise<Column | undefined>;
  extractPksValues(data: any, asString?: boolean): any;
  readByPk(
    id?: any,
    validateFormula?: boolean,
    query?: any,
    param?: {
      ignoreView?: boolean;
      getHiddenColumn?: boolean;
      throwErrorIfInvalidParams?: boolean;
      extractOnlyPrimaries?: boolean;
      apiVersion?: AtApiVersion;
      extractOrderColumn?: boolean;
    },
  ): Promise<any>;

  getViewId(): string;

  getTnPath(
    tb:
      | {
          table_name: string;
        }
      | string,
    alias?: string,
  ): string | Knex.Raw<any>;

  beforeInsert(
    data: any,
    req,
    params?: {
      allowSystemColumn?: boolean;
    },
  ): Promise<void>;
  beforeUpdate(data: any, req): Promise<void>;
  beforeBulkInsert(
    data: any,
    req,
    params?: {
      allowSystemColumn?: boolean;
    },
  ): Promise<void>;

  afterAddChild(props: {
    columnTitle: string;
    columnId: string;
    refColumnTitle: string;
    rowId: unknown;
    refRowId: unknown;
    req: AtRequest;
    model?: Model;
    refModel?: Model;
    displayValue: unknown;
    refDisplayValue: unknown;
    type: RelationTypes;
  }): Promise<void>;

  afterRemoveChild({
    columnTitle,
    columnId,
    rowId,
    refRowId,
    req,
    model,
    refModel,
    displayValue,
    refDisplayValue,
    type,
  }: {
    columnTitle: string;
    columnId: string;
    refColumnTitle: string;
    rowId: unknown;
    refRowId: unknown;
    req: AtRequest;
    model: Model;
    refModel: Model;
    displayValue: unknown;
    refDisplayValue: unknown;
    type: RelationTypes;
  }): Promise<void>;

  afterInsert({
    data,
    insertData,
    req,
  }: {
    data: any;
    insertData: any;
    req: AtRequest;
  }): Promise<void>;

  afterUpdate(
    prevData: any,
    newData: any,
    req,
    updateObj?: Record<string, any>,
  ): Promise<void>;

  afterBulkInsert(data: any[], req): Promise<void>;

  afterBulkDelete(
    data: any,
    req: any,
    isBulkAllOperation?: boolean,
    bulkEventType?: AuditV1OperationTypes,
    rowEventType?: AuditV1OperationTypes,
  ): Promise<void>;

  afterBulkRestore(
    data: any,
    req: any,
    isBulkAllOperation?: boolean,
  ): Promise<void>;

  permanentDeleteByIds(
    rowIds: string[],
    cookie: any,
    isBulkAllOperation?: boolean,
  ): Promise<any[]>;

  applySortAndFilter(param: {
    table: Model;
    view?: View;
    where: string;
    qb;
    sort: string;
    onlySort?: boolean;
    skipViewFilter?: boolean;
  }): Promise<void>;

  bulkAudit({
    qb,
    data,
    conditions,
    req,
    event,
  }: {
    qb: any;
    data?: Record<string, any>;
    conditions: FilterType[];
    req: AtRequest;
    event: BulkAuditV1OperationTypes;
  }): Promise<void>;

  _getListArgs(
    args: XcFilterWithAlias,
    options?: {
      apiVersion?: AtApiVersion;
      nested?: boolean;
    },
  ): XcFilter;

  getCustomConditionsAndApply(params: {
    view?: View;
    column: Column<any>;
    qb?;
    filters?;
    args;
    rowId;
    columns?: Column[];
  }): Promise<any>;
  getHighestOrderInTable(): Promise<BigNumber>;

  shuffle({ qb }: { qb: Knex.QueryBuilder }): Promise<void>;
  getSelectQueryBuilderForFormula(
    column: Column<any>,
    tableAlias?: string,
    validateFormula?: boolean,
    aliasToColumnBuilder?: any,
  ): Promise<any>;

  errorInsert(_e, _data, _cookie): void | Promise<void>;
  errorUpdate(_e, _data, _cookie): void | Promise<void>;

  prepareNestedLinkQb(param: {
    nestedCols: Column[];
    data: Record<string, any>;
    insertObj: Record<string, any>;
    req: AtRequest;
  }): Promise<{
    postInsertOps: ((
      rowId: any,
      trx?: Knex | Knex.Transaction,
    ) => Promise<string>)[];
    preInsertOps: ((trx?: Knex | Knex.Transaction) => Promise<string>)[];
    postInsertAuditEntries: NestedLinkAuditEntry[];
    postInsertLastModifiedEntries: NestedLinkLastModifiedEntry[];
    displacedRecords: DisplacedRecord[];
  }>;

  handleValidateBulkInsert(
    d: Record<string, any>,
    columns?: Column[],
    params?: {
      allowSystemColumn: boolean;
      undo: boolean;
      typecast: boolean;
    },
  ): Promise<any>;

  validate(
    data: Record<string, any>,
    columns?: Column[],
    {
      typecast,
      allowSystemColumn,
    }?: { typecast?: boolean; allowSystemColumn?: boolean },
  ): Promise<boolean>;

  runOps(ops: Promise<string>[], trx?: CustomKnex): Promise<void>;
  statsUpdate(_args: { count: number }): Promise<void | any>;
  afterAddOrRemoveChild(
    commonAuditObj: {
      opType: AuditV1OperationTypes;
      model: Model;
      refModel: Model;
      columnTitle: string;
      columnId: string;
      refColumnTitle: string;
      refColumnId: string;
      req: AtRequest;
    },
    auditObjs: Array<{
      rowId: unknown;
      refRowId: unknown;
      displayValue?: unknown;
      refDisplayValue?: unknown;
      type: RelationTypes;
    }>,
  ): Promise<void>;

  sanitizeQuery(query: string | string[]): any;
  getNestedColumn(column: Column, context?: AtContext): Promise<Column | any>;

  checkPermission(params: {
    entity: PermissionEntity;
    entityId: string | string[];
    permission: PermissionKey;
    user: any;
    req: any;
  }): Promise<void>;

  chunkList(args: {
    pks: string[];
    chunkSize?: number;
    apiVersion?: AtApiVersion;
    args?: any;
    extractOnlyPrimaries?: boolean;
    deletedOnly?: boolean;
  }): Promise<any[]>;

  list(
    args?: {
      where?: string;
      limit?: any;
      offset?: any;
      filterArr?: Filter[];
      sortArr?: Sort[];
      sort?: string | string[];
      fieldsSet?: Set<string>;
      limitOverride?: number;
      pks?: string;
      customConditions?: Filter[];
      apiVersion?: AtApiVersion;
    },
    options?: {
      ignoreViewFilterAndSort?: boolean;
      ignorePagination?: boolean;
      validateFormula?: boolean;
      throwErrorIfInvalidParams?: boolean;
      limitOverride?: number;
      skipSubstitutingColumnIds?: boolean;
    },
  ): Promise<any>;
  selectObject(params: {
    fieldsSet?: Set<string>;
    qb: Knex.QueryBuilder & Knex.QueryInterface;
    columns?: Column[];
    fields?: string[] | string;
    extractPkAndPv?: boolean;
    viewId?: string;
    alias?: string;
    validateFormula?: boolean;
    pkAndPvOnly?: boolean;
    linksAsLtar?: boolean;
    fk_display_value_column_id?: string | null;
  }): Promise<void>;
  getProto(param?: {
    apiVersion?: AtApiVersion;
    linksAsLtar?: boolean;
  }): Promise<
    {
      __proto__?: {
        __columnAliases?: {
          [key: string]: any;
        };
      };
    } & {
      [key: string]: any;
    }
  >;

  broadcastLinkUpdates(ids: Array<string>): Promise<void>;
  getSource(): Promise<Source>;
  /**
   * Creates a non-transactional clone of this instance for operations
   * that need to run outside the current transaction context.
   */
  getNonTransactionalClone(): IBaseModelSqlV2;

  now(): string;
  schema?: string;
  get viewId(): string;
  /** Returns the active database driver (transaction if active, otherwise base driver) */
  get dbDriver(): CustomKnex;
  /** Returns the base (non-transactional) database driver */
  get knex(): CustomKnex;
  get isSqlite(): boolean;
  get isPg(): boolean;
  get isMySQL(): boolean;
  get isMssql(): boolean;
  get isOracle(): boolean;
  get isSnowflake(): boolean;
  get isDatabricks(): boolean;
  get clientType(): string;
  get clientMeta(): {
    isSqlite: boolean;
    isPg: boolean;
    isMySQL: boolean;
    isMssql: boolean;
    isOracle: boolean;
  };

  /**
   * Set to true when a formula dry-run fails during validateFormula.
   * Subsequent dry-runs on the same instance short-circuit immediately
   * to avoid amplifying requests to an overwhelmed external source.
   */
  formulaDryRunFailed?: boolean;
  getRlsConditions(): Promise<Filter[]>;
  getSoftDeleteFilter(): Promise<Knex.QueryCallback | null>;
  updateLinkedRecordsOnDelete(deletedIds: any[], cookie?: any): Promise<void>;
  afterSoftDeleteCompleted(params: {
    cookie: AtRequest;
    operationNow: string;
  }): Promise<void>;
}
