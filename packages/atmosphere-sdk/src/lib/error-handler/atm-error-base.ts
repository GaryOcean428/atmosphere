import { BaseType, SourceType } from '../Api';
import {
  BadRequestV2,
  MetaError,
  AtErrorArgs,
  NotAllowed,
  NotFound,
  OptionsNotExistsError,
  SsoError,
  TestConnectionError,
  UnprocessableEntity,
} from '../error/atm-base.error';
import {
  CreditsExhaustedDetailsType,
  AtErrorType,
  PlanLimitExceededDetailsType,
} from '../globals';
import {
  HigherPlan,
  PlanFeatureAddonMessages,
  PlanFeatureTypes,
  PlanFeatureUpgradeMessages,
} from '../payment';
import UITypes from '../UITypes';
import { AtErrorCodexManager } from './atm-error-codex-manager';

export class AtErrorBase {
  constructor() {
    this._errorCodex = new AtErrorCodexManager();
  }
  protected _errorCodex: AtErrorCodexManager;
  get errorCodex() {
    return this._errorCodex;
  }

  authenticationRequired(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_AUTHENTICATION_REQUIRED,
      args
    );
  }

  apiTokenNotAllowed(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_API_TOKEN_NOT_ALLOWED,
      args
    );
  }

  workspaceNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_WORKSPACE_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  orgNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_ORG_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  columnAssociatedWithLink(_id: string, args: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_COLUMN_ASSOCIATED_WITH_LINK,
      args
    );
  }

  tableAssociatedWithLink(_id: string, args: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_TABLE_ASSOCIATED_WITH_LINK,
      args
    );
  }

  viewColumnNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_VIEW_COLUMN_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  baseNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_BASE_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  trashNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TRASH_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  parentInTrash(parentType: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_PARENT_IN_TRASH, {
      params: parentType,
      ...args,
    });
  }

  dashboardNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_DASHBOARD_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  interfaceNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INTERFACE_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  interfacePageNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INTERFACE_PAGE_NOT_FOUND,
      {
        params: id,
        ...args,
      }
    );
  }

  /**
   * Write op attempted while previewing an interface as another USER — the
   * dedicated type lets the UI tell "you are previewing" apart from a real
   * permission denial.
   */
  interfacePreviewWriteBlocked(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INTERFACE_PREVIEW_WRITE_BLOCKED,
      {
        ...args,
      }
    );
  }

  chatSessionNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_CHAT_SESSION_NOT_FOUND,
      {
        params: id,
        ...args,
      }
    );
  }

  chatMessageNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_CHAT_MESSAGE_NOT_FOUND,
      {
        params: id,
        ...args,
      }
    );
  }

  workflowNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_WORKFLOW_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  widgetNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_WIDGET_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  viewSectionNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_VIEW_SECTION_NOT_FOUND,
      {
        params: id,
        ...args,
      }
    );
  }

  baseSectionNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_BASE_SECTION_NOT_FOUND,
      {
        params: id,
        ...args,
      }
    );
  }

  apiClientNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_API_CLIENT_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  sourceNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SOURCE_NOT_FOUND, {
      params: id,
      ...args,
    });
  }
  noSourcesFound(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_DATA_SOURCES_NOT_FOUND,
      args
    );
  }

  tableNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TABLE_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  userNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_USER_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  teamNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TEAM_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  viewNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_VIEW_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  filterNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_FILTER_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  hookNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_HOOK_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  genericNotFound(resource: string, id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_GENERIC_NOT_FOUND, {
      params: [resource, id],
      ...args,
    });
  }

  requiredFieldMissing(field: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_REQUIRED_FIELD_MISSING,
      {
        params: field,
        ...args,
      }
    );
  }

  duplicateRecord(id: string | string[], args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_DUPLICATE_RECORD, {
      params: id,
      ...args,
    });
  }

  fieldNotFound(
    param:
      | string
      | {
          field: string;
          onSection?: string;
        }
      | null
      | undefined,
    args?: AtErrorArgs
  ): never {
    let message = '';
    if (typeof param === 'string') {
      message = `'${param}'`;
    } else if (param && typeof param === 'object') {
      const onSection = param.onSection ? ` on ${param.onSection}` : '';
      message = `'${param.field ?? 'unknown'}'${onSection}`;
    } else {
      message = `'unknown'`;
    }
    throw this.errorCodex.generateError(AtErrorType.ERR_FIELD_NOT_FOUND, {
      params: message,
      ...args,
    });
  }

  extensionNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_EXTENSION_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  invalidOffsetValue(offset: string | number, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INVALID_OFFSET_VALUE, {
      params: `${offset}`,
      ...args,
    });
  }
  invalidPageValue(page: string | number, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INVALID_PAGE_VALUE, {
      params: `${page}`,
      ...args,
    });
  }

  invalidPrimaryKey(value: any, pkColumn: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INVALID_PK_VALUE, {
      params: [value, pkColumn],
      ...args,
    });
  }

  invalidLimitValue(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INVALID_LIMIT_VALUE, {
      ...args,
    });
  }

  invalidFilter(filter: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INVALID_FILTER, {
      params: filter,
      ...args,
    });
  }

  invalidValueForField(
    payload:
      | string
      | { value: string; column: string; type: UITypes; reason?: string },
    args?: AtErrorArgs
  ): never {
    const withReason =
      typeof payload === 'object' && payload.reason
        ? `, reason: ${payload.reason}`
        : ``;
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INVALID_VALUE_FOR_FIELD,
      {
        params:
          typeof payload === 'string'
            ? payload
            : `Invalid value '${payload.value}' for type '${payload.type}' on column '${payload.column}'${withReason}`,
        ...args,
      }
    );
  }

  unsupportedFilterOperation(operation: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_UNSUPPORTED_FILTER_OPERATION,
      {
        params: operation,
        ...args,
      }
    );
  }

  valueLengthExceedLimit(
    payload: {
      column: string;
      type: UITypes;
      length: number;
      maxLength: number;
    },
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INVALID_VALUE_FOR_FIELD,
      {
        params: `Value length '${payload.length}' is exceeding allowed limit '${payload.maxLength}' for type '${payload.type}' on column '${payload.column}'`,
        ...args,
      }
    );
  }

  invalidSharedViewPassword(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INVALID_SHARED_VIEW_PASSWORD,
      {
        ...args,
      }
    );
  }

  invalidSharedDashboardPassword(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SHARED_DASHBOARD_PASSWORD_INVALID,
      {
        ...args,
      }
    );
  }

  invalidSharedInterfacePagePassword(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SHARED_INTERFACE_PAGE_PASSWORD_INVALID,
      {
        ...args,
      }
    );
  }

  invalidAttachmentJson(payload: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INVALID_ATTACHMENT_JSON,
      {
        params: payload,
        ...args,
      }
    );
  }

  notImplemented(feature: string = 'Feature', args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_NOT_IMPLEMENTED, {
      params: feature,
      ...args,
    });
  }

  internalServerError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INTERNAL_SERVER, {
      params: message,
      ...args,
    });
  }

  systemMisconfigured(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SYSTEM_MISCONFIGURED, {
      params: message,
      ...args,
    });
  }

  formulaError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_FORMULA, {
      params: message,
      ...args,
    });
  }

  formulaCircularRefError(message?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_CIRCULAR_REF_IN_FORMULA,
      {
        params: message ?? 'Circular reference detected in formula',
        ...args,
      }
    );
  }

  unauthorized(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_AUTHENTICATION_REQUIRED,
      {
        params: message,
        ...args,
      }
    );
  }

  forbidden(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_FORBIDDEN, {
      params: message,
      ...args,
    });
  }

  insufficientPrivilege(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INSUFFICIENT_PRIVILEGE,
      {
        params: message,
        ...args,
      }
    );
  }

  sourceDataReadOnly(name: string) {
    this.forbidden(`Source '${name}' is read-only`);
  }

  sourceMetaReadOnly(name: string) {
    this.forbidden(`Source '${name}' schema is read-only`);
  }

  systemFieldNonModifiable(): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SYSTEM_FIELD_NON_MODIFIABLE,
      {}
    );
  }

  integrationNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INTEGRATION_NOT_FOUND, {
      params: id,
      ...(args || {}),
    });
  }

  syncConfigNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SYATMOSPHERE_CONFIG_NOT_FOUND, {
      params: id,
      ...(args || {}),
    });
  }

  cannotCalculateIntermediateOrderError(): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_CANNOT_CALCULATE_INTERMEDIATE_ORDER,
      {}
    );
  }

  reorderFailed(): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_REORDER_FAILED, {});
  }

  integrationLinkedWithMultiple(
    bases: BaseType[],
    sources: SourceType[],
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INTEGRATION_LINKED_WITH_BASES,
      {
        params: bases.map((s) => s.title).join(', '),
        details: {
          bases: bases.map((b) => {
            return {
              id: b.id,
              title: b.title,
            };
          }),
          sources: sources.map((s) => {
            return {
              id: s.id,
              base_id: s.base_id,
              title: s.alias,
            };
          }),
        },
        ...(args || {}),
      }
    );
  }

  invalidAttachmentUploadScope(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INVALID_ATTACHMENT_UPLOAD_SCOPE,
      args
    );
  }

  webhookError(message?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_WEBHOOK_ERROR, {
      params: message,
      ...args,
    });
  }

  invalidWebhookUrl(url: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_WEBHOOK_URL_INVALID, {
      ...args,
      params: `Invalid URl ${url || ''}`,
    });
  }

  planLimitExceeded(
    message: string,
    details: Omit<PlanLimitExceededDetailsType, 'higherPlan'>,
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_PLAN_LIMIT_EXCEEDED, {
      params: message,
      ...args,
      details: {
        ...details,
        ...(details?.plan ? { higherPlan: HigherPlan[details.plan] } : {}),
      },
    });
  }

  creditPackNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_CREDIT_PACK_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  creditsExhausted(
    details?: CreditsExhaustedDetailsType,
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_CREDITS_EXHAUSTED, {
      ...args,
      details,
    });
  }

  duplicateAlias(
    param: {
      type: 'table' | 'column' | 'view';
      alias: string;
      base: string;
      label?: string;
      additionalTrace?: Record<string, string>;
    },
    args?: AtErrorArgs
  ): never {
    const stackTrace = [
      ...Object.keys(param.additionalTrace ?? {}).map(
        (key) => `${key} '${param.additionalTrace[key]}'`
      ),
      `base '${param.base}'`,
    ].join(', ');
    throw this.errorCodex.generateError(AtErrorType.ERR_DUPLICATE_IN_ALIAS, {
      params: `Duplicate ${param.type} ${param.label ?? 'alias'} '${
        param.alias
      }' at ${stackTrace}`,
      ...args,
    });
  }

  allowedOnlySSOAccess(ncWorkspaceId: string): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SSO_LOGIN_REQUIRED, {
      params: ncWorkspaceId,
    });
  }
  allowedOnlySSOGeneratedToken(ncWorkspaceId: string): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SSO_GENERATED_TOKEN_REQUIRED,
      {
        params: ncWorkspaceId,
      }
    );
  }
  mfaSetupRequired(ncWorkspaceId: string): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_MFA_SETUP_REQUIRED, {
      params: ncWorkspaceId,
    });
  }
  maxPayloadLimitExceeded(limit: number, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_MAX_PAYLOAD_LIMIT_EXCEEDED,
      {
        params: limit.toString(),
        ...args,
      }
    );
  }
  baseUserError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_BASE_COLLABORATION, {
      params: message,
      ...args,
    });
  }

  orgUserError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_ORG_USER, {
      params: message,
      ...args,
    });
  }

  tableError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TABLE_OP_FAILED, {
      params: message,
      ...args,
    });
  }

  columnError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_COLUMN_OP_FAILED, {
      params: message,
      ...args,
    });
  }

  baseError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_BASE_OP_FAILED, {
      params: message,
      ...args,
    });
  }

  maxWorkspaceLimitReached(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_MAX_WORKSPACE_LIMIT_REACHED,
      {
        ...args,
      }
    );
  }

  pluginTestError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TEST_PLUGIN_FAILED, {
      params: message,
      ...args,
    });
  }

  relationFieldNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_RELATION_FIELD_NOT_FOUND,
      {
        params: id,
        ...args,
      }
    );
  }

  unSupportedRelation(relation: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_UNSUPPORTED_RELATION, {
      params: `Relation ${relation} is not supported`,
      ...args,
    });
  }

  // for atm-sql-executor, the error returned is possible to be an Error object
  // thus `error.message` is needed to access it
  externalError(error: string | Error, args?: AtErrorArgs): never {
    let message: string = '';
    if (['string'].includes(typeof error)) {
      message = `${error}`;
    } else if (typeof error === 'object') {
      if (error.message) {
        message = error.message;
      } else {
        // we log the error if we don't know the schema yet
        console.log(
          `Unknown error schema from atm-sql-executor: ${JSON.stringify(error)}`
        );
      }
    }
    if (!message || message === '') {
      // generic error message to prevent programmatic error to propagate to UI
      message = 'Error when executing query in external data source';
    }
    throw this.errorCodex.generateError(
      AtErrorType.ERR_IN_EXTERNAL_DATA_SOURCE,
      {
        params: message,
        ...args,
      }
    );
  }

  externalTimeOut(message?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_EXTERNAL_DATA_SOURCE_TIMEOUT,
      {
        params: message,
        ...args,
      }
    );
  }
  prohibitedSyncTableOperation(
    param: {
      modelName: string;
      operation: 'insert' | 'update' | 'delete' | 'create_form_view';
    },
    args?: AtErrorArgs
  ): never {
    let message = '';
    switch (param.operation) {
      case 'insert':
      case 'update':
      case 'delete':
        message = `Prohibited data insert / update / delete operation on synced table ${param.modelName}`;
        break;
      case 'create_form_view':
        message = `Form view creation is not supported for synced table ${param.modelName}`;
        break;
    }
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SYATMOSPHERE_TABLE_OPERATION_PROHIBITED,
      {
        params: message,
        ...args,
      }
    );
  }
  featureNotSupported(
    props: {
      feature: PlanFeatureTypes;
      isOnPrem?: boolean;
    },
    args?: AtErrorArgs
  ) {
    // Add-on-only: no plan tier grants it, so skip the upgrade prefix entirely.
    // On-prem entitlement is signed into the license key, hence sales-assisted.
    const addonMessage = PlanFeatureAddonMessages[props.feature];
    if (addonMessage) {
      throw this.errorCodex.generateError(
        AtErrorType.ERR_FEATURE_NOT_SUPPORTED,
        {
          params: props.isOnPrem
            ? `${addonMessage} Contact sales to add it to your license.`
            : `${addonMessage} Add it from your workspace billing settings.`,
          ...args,
        }
      );
    }

    if (props.isOnPrem) {
      throw this.errorCodex.generateError(
        AtErrorType.ERR_FEATURE_NOT_SUPPORTED,
        {
          params: `Please upgrade your license ${
            PlanFeatureUpgradeMessages[props.feature] ?? 'to use this feature.'
          }`,
          ...args,
        }
      );
    }

    throw this.errorCodex.generateError(AtErrorType.ERR_FEATURE_NOT_SUPPORTED, {
      params: `Upgrade to a higher plan ${
        PlanFeatureUpgradeMessages[props.feature] ?? 'to use this feature.'
      }`,
      ...args,
    });
  }

  invalidRequestBody(message: string): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INVALID_REQUEST_BODY, {
      params: message,
    });
  }

  unprocessableEntity(message = 'Unprocessable entity'): never {
    throw new UnprocessableEntity(message);
  }

  testConnectionError(message = 'Unprocessable entity', code?: string): never {
    throw new TestConnectionError(message, code);
  }

  notAllowed(message = 'Not allowed'): never {
    throw new NotAllowed(message);
  }

  emailDomainNotAllowed(domain: string): never {
    throw new SsoError(
      `Email domain ${domain} is not allowed for this organization`
    );
  }

  metaError(param: { message: string; sql: string }): never {
    throw new MetaError(param);
  }

  notFound(message = 'Not found'): never {
    throw new NotFound(message);
  }

  badRequest(message): never {
    throw new BadRequestV2(message);
  }

  tooManyRequests(message?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TOO_MANY_REQUESTS, {
      customMessage: message,
      ...args,
    });
  }

  optionsNotExists(props: {
    columnTitle: string;
    options: string[];
    validOptions: string[];
  }): never {
    throw new OptionsNotExistsError(props);
  }

  outOfSync(message: string): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_OUT_OF_SYNC, {
      params: message,
    });
  }

  filterVerificationFailed(errors: string[]): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_FILTER_VERIFICATION_FAILED,
      {
        params: errors.join(', '),
      }
    );
  }
  storageFileCreateError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_STORAGE_FILE_CREATE, {
      params: message,
      ...args,
    });
  }

  storageFileReadError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_STORAGE_FILE_READ, {
      params: message,
      ...args,
    });
  }

  storageFileDeleteError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_STORAGE_FILE_DELETE, {
      params: message,
      ...args,
    });
  }

  storageFileStreamError(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_STORAGE_FILE_STREAM, {
      params: message,
      ...args,
    });
  }
  subscriptionAlreadyExists(
    workspaceOrOrgId: string,
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SUBSCRIPTION_ALREADY_EXISTS,
      {
        params: workspaceOrOrgId,
        ...args,
      }
    );
  }

  subscriptionNotFound(workspaceOrOrgId: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SUBSCRIPTION_NOT_FOUND,
      {
        params: workspaceOrOrgId,
        ...args,
      }
    );
  }

  planNotAvailable(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_PLAN_NOT_AVAILABLE,
      args
    );
  }

  seatCountMismatch(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SEAT_COUNT_MISMATCH, {
      params: 'There was a mismatch in the seat count, please try again',
      ...args,
    });
  }

  invalidPaymentPayload(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INVALID_PAYMENT_PAYLOAD,
      {
        params: 'Invalid payment payload',
        ...args,
      }
    );
  }

  stripeCustomerNotFound(customerId: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_STRIPE_CUSTOMER_NOT_FOUND,
      {
        params: customerId,
        ...args,
      }
    );
  }

  stripeSubscriptionNotFound(
    subscriptionId: string,
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_STRIPE_SUBSCRIPTION_NOT_FOUND,
      {
        params: subscriptionId,
        ...args,
      }
    );
  }

  subscriptionOwnershipMismatch(
    entity: 'workspace' | 'org',
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SUBSCRIPTION_OWNERSHIP_MISMATCH,
      {
        params: `Subscription does not belong to the ${entity}`,
        ...args,
      }
    );
  }

  internalCustomerNotSupported(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_INTERNAL_CUSTOMER_NOT_SUPPORTED,
      {
        params: 'Internal customer not supported',
        ...args,
      }
    );
  }

  subscriptionCreateFailed(message: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SUBSCRIPTION_CREATE_FAILED,
      {
        params: message,
        ...args,
      }
    );
  }

  stripeWebhookVerificationFailed(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_STRIPE_WEBHOOK_VERIFICATION_FAILED,
      {
        params: 'Webhook signature verification failed',
        ...args,
      }
    );
  }
  planAlreadyExists(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_PLAN_ALREADY_EXISTS, {
      params: id,
      ...args,
    });
  }

  workflowEmptyNode(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_WORKFLOW_EMPTY_NODE, {
      ...args,
    });
  }

  workflowTriggerNodeNotFound(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_WORKFLOW_TRIGGER_NODE_NOT_FOUND,
      {
        ...args,
      }
    );
  }

  workflowNodeExecutionFailed(
    nodeTitle: string,
    error: string,
    args?: AtErrorArgs
  ): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_WORKFLOW_NODE_EXECUTION_FAILED,
      {
        params: `Node "${nodeTitle}" failed: ${error}`,
        ...args,
      }
    );
  }

  workflowWaitingExecutions(count: number, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_WORKFLOW_WAITING_EXECUTIONS,
      {
        params: count.toString(),
        ...args,
      }
    );
  }

  workflowMaxIterationsExceeded(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_WORKFLOW_MAX_ITERATIONS_EXCEEDED,
      {
        ...args,
      }
    );
  }

  workflowNodeNotFound(nodeTitle: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_WORKFLOW_NODE_NOT_FOUND,
      {
        params: `Node "${nodeTitle}" not found`,
        ...args,
      }
    );
  }

  scriptNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SCRIPT_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  rlsPolicyNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_RLS_POLICY_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  tableSyncNotFound(id: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TABLE_SYATMOSPHERE_NOT_FOUND, {
      params: id,
      ...args,
    });
  }

  tableTrashNotSupported(tableTitle: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_TABLE_TRASH_NOT_SUPPORTED,
      {
        params: tableTitle,
        ...args,
      }
    );
  }

  recordRestoreConflict(details: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_RECORD_RESTORE_CONFLICT,
      {
        params: details,
        ...args,
      }
    );
  }

  recordNotTrashed(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_RECORD_NOT_TRASHED, {
      ...args,
    });
  }

  trashBatchLimitExceeded(limit: number, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_TRASH_BATCH_LIMIT_EXCEEDED,
      {
        params: limit.toString(),
        ...args,
      }
    );
  }

  methodNotAllowed(method: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_METHOD_NOT_ALLOWED, {
      params: `${method} method not allowed`,
      ...args,
    });
  }

  licenseRequired(feature?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_LICENSE_REQUIRED, {
      params: feature || '',
      ...args,
    });
  }

  licenseSuspended(args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_LICENSE_SUSPENDED, {
      ...args,
    });
  }

  sandboxBlocked(message?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SANDBOX_BLOCKED, {
      params: message || '',
      ...args,
    });
  }

  sandboxProductionBlocked(message?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(
      AtErrorType.ERR_SANDBOX_PRODUCTION_BLOCKED,
      {
        params: message || '',
        ...args,
      }
    );
  }

  snapshotBlocked(message?: string, args?: AtErrorArgs): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_SNAPSHOT_BLOCKED, {
      params: message || '',
      ...args,
    });
  }
}
