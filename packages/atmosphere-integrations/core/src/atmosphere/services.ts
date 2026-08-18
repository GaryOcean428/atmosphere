import type { AtmosphereSDK } from '../sdk';

export interface RecordField {
  [key: string]: any;
}

export interface DataRecord {
  id?: string | number;
  fields: RecordField;
}

export interface DataRecordId {
  id: string | number;
}

export interface DataRecordWithDeleted extends DataRecordId {
  deleted: boolean;
}

export interface DataListResponse {
  records?: DataRecord[];
  record?: DataRecord | null;
  next?: string;
  prev?: string;
  nestedNext?: string;
  nestedPrev?: string;
}

export interface DataInsertRequest {
  fields: RecordField;
}

export interface DataUpdateRequest {
  id: string | number;
  fields: RecordField;
}

export interface DataDeleteRequest {
  id: string | number;
}

export interface DataListParams {
  baseId?: string;
  modelId: string;
  query: any;
  viewId?: string;
  ignorePagination?: boolean;
  req: AtmosphereSDK.AtRequest;
}

export interface DataInsertParams {
  baseId?: string;
  viewId?: string;
  modelId: string;
  body: DataInsertRequest | DataInsertRequest[];
  cookie: any;
}

export interface DataUpdateParams {
  baseId?: string;
  modelId: string;
  viewId?: string;
  body: DataUpdateRequest | DataUpdateRequest[];
  cookie: any;
}

export interface DataDeleteParams {
  baseId?: string;
  modelId: string;
  viewId?: string;
  cookie: any;
  body?: DataDeleteRequest | DataDeleteRequest[];
  queryRecords?: string | string[];
}

export interface NestedDataListParams {
  modelId: string;
  rowId: string;
  query: any;
  viewId: string;
  columnId: string;
  req: AtmosphereSDK.AtRequest;
}

export interface DataReadParams {
  modelId: string;
  rowId: string;
  query: any;
  viewId?: string;
  req: AtmosphereSDK.AtRequest;
}

export interface TransformRecordToV3Param {
  context: AtmosphereSDK.AtContext;
  record: any;
  primaryKey: AtmosphereSDK.ColumnType;
  primaryKeys?: AtmosphereSDK.ColumnType[];
  requestedFields?: string[];
  columns?: AtmosphereSDK.ColumnType[];
  nestedLimit?: number;
  skipSubstitutingColumnIds?: boolean;
  depth?: number;
}

export interface TransformRecordsToV3FormatParam {
  context: AtmosphereSDK.AtContext;
  records: any[];
  primaryKey: AtmosphereSDK.ColumnType;
  primaryKeys?: AtmosphereSDK.ColumnType[];
  requestedFields?: string[];
  columns?: AtmosphereSDK.ColumnType[];
  nestedLimit?: number;
  skipSubstitutingColumnIds?: boolean;
  depth?: number;
}

export type NestedLinkParams = {
  modelId: string;
  columnId: string;
  rowId: string;
  refRowIds:
    | string
    | string[]
    | number
    | number[]
    | Record<string, any>
    | Record<string, any>[];
  query?: any;
  cookie?: any;
  viewId?: string;
};

export interface IDataV3Service {
  transformRecordsToV3Format(
    param: TransformRecordsToV3FormatParam,
  ): Promise<DataRecord[]>;

  dataList<T extends boolean>(
    context: AtmosphereSDK.AtContext,
    param: DataListParams,
    pagination?: T,
  ): Promise<T extends true ? DataListResponse : DataRecord[]>;

  dataInsert(
    context: AtmosphereSDK.AtContext,
    param: DataInsertParams,
  ): Promise<{ records: DataRecord[] }>;

  dataDelete(
    context: AtmosphereSDK.AtContext,
    param: DataDeleteParams,
  ): Promise<{ records: DataRecordWithDeleted[] }>;

  dataUpdate(
    context: AtmosphereSDK.AtContext,
    param: DataUpdateParams,
  ): Promise<{ records: DataRecord[] }>;

  nestedDataList(
    context: AtmosphereSDK.AtContext,
    param: NestedDataListParams,
  ): Promise<DataListResponse>;

  dataRead(
    context: AtmosphereSDK.AtContext,
    param: DataReadParams,
  ): Promise<DataRecord>;

  nestedLink(
    context: AtmosphereSDK.AtContext,
    param: NestedLinkParams,
  ): Promise<{ success: boolean }>;

  nestedUnlink(
    context: AtmosphereSDK.AtContext,
    param: NestedLinkParams,
  ): Promise<{ success: boolean }>;
}

export interface ITablesService {
  list(
    context: AtmosphereSDK.AtContext,
    param: { base_id: string },
  ): Promise<Array<{ id: string; title: string; table_name: string }>>;

  tableUpdate(
    context: AtmosphereSDK.AtContext,
    param: {
      tableId: any;
      table: Partial<AtmosphereSDK.TableReqType> & { base_id?: string };
      baseId?: string;
      user: AtmosphereSDK.UserType;
      req: AtmosphereSDK.AtRequest;
    },
  ): Promise<boolean>;

  reorderTable(
    context: AtmosphereSDK.AtContext,
    param: { tableId: string; order: any; req: AtmosphereSDK.AtRequest },
  ): Promise<any>;

  tableDelete(
    context: AtmosphereSDK.AtContext,
    param: {
      tableId: string;
      user: AtmosphereSDK.UserType;
      forceDeleteRelations?: boolean;
      forceDeleteSyncs?: boolean;
      req?: any;
    },
  ): Promise<any>;

  getTableWithAccessibleViews(
    context: AtmosphereSDK.AtContext,
    param: {
      tableId: string;
      user: AtmosphereSDK.UserType;
    },
  ): Promise<AtmosphereSDK.TableType & {
    views: Array<AtmosphereSDK.ViewType>
    columns: Array<AtmosphereSDK.ColumnType>
  }>;

  getAccessibleTables(
    context: AtmosphereSDK.AtContext,
    param: {
      baseId: string;
      sourceId?: string;
      includeM2M?: boolean;
      roles: Record<string, boolean>;
      user: AtmosphereSDK.UserType;
    },
  ): Promise<AtmosphereSDK.TableType[]>;

  tableCreate(
    context: AtmosphereSDK.AtContext,
    param: {
      baseId: string;
      sourceId?: string;
      table: AtmosphereSDK.TableReqType;
      user: AtmosphereSDK.UserType;
      req: AtmosphereSDK.AtRequest;
      synced?: boolean;
      apiVersion?: AtmosphereSDK.AtApiVersion;
    },
  ): Promise<AtmosphereSDK.TableType>;
}

interface XcEmailAttachment {
  /** Name that will be displayed to the recipient. Unicode is allowed. */
  filename?: string;
  /** Contents of the file */
  content?: string | Buffer;
  /** Filesystem path or URL (including data URIs). Recommended for large files. */
  path?: string;
  /** HTTP(S) URL that Nodemailer should fetch and attach */
  href?: string;
  /** Custom HTTP headers for href, for example { authorization: 'Bearer …' } */
  httpHeaders?: object;
  /** Explicit MIME type. Defaults to the type inferred from filename */
  contentType?: string;
  /** Content‑Disposition header. Defaults to 'attachment' */
  contentDisposition?: string;
  /** Content‑ID for embedding the attachment inline in the HTML body */
  cid?: string;
  /** Encoding applied when content is a string (e.g. 'base64', 'hex') */
  encoding?: string;
  /** Custom headers for the individual MIME node */
  headers?: object;
  /** Advanced: Full pre‑built MIME node including headers. Overrides every other field. */
  raw?: string;
}

interface RawMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: XcEmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
}


export interface IMailService {
  sendMailRaw(param: RawMailParams): Promise<boolean>;
}

export interface CommentAuthor {
  id: string | null;
  name: string | null;
  email: string | null;
}

export interface CommentMentionRef {
  id: string;
  email: string | null;
  name: string | null;
}

/**
 * A comment enriched for consumption by workflow nodes: the raw + plain-text
 * body, the resolved author, and the @mentioned users parsed from the body.
 * Mirrors what the comment-trigger dispatcher builds on the live event path.
 */
export interface CommentRecord {
  id: string;
  record_id: string | null;
  body: string;
  body_plain: string;
  author: CommentAuthor;
  created_at: string | null;
  updated_at: string | null;
  parent_comment_id: string | null;
  mentions: CommentMentionRef[];
}

export interface ICommentsService {
  /**
   * List comments on a table, enriched with plain-text body, resolved author
   * and parsed @mentions. Used by nodes that need real comment data (e.g. the
   * comment trigger's "Test" action fetches a sample comment through this).
   */
  listByModel(
    context: AtmosphereSDK.AtContext,
    param: { modelId: string; limit?: number },
  ): Promise<CommentRecord[]>;
}
