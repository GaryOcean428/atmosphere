import { AtApiVersion } from 'atmosphere-sdk';
import { AtErrorV1 } from './AtErrorV1';
import { AtErrorV3 } from './ncErrorV3';
import type { ErrorObject } from 'ajv';
import type {
  BaseType,
  CreditsExhaustedDetailsType,
  AtErrorArgs,
  PlanLimitExceededDetailsType,
  SourceType,
  UITypes,
} from 'atmosphere-sdk';
export { AjvError } from './AtErrorV1';

export class AtError {
  static _ = new AtErrorV1();
  static _V3 = new AtErrorV3();

  // return ncError based on api version
  static get(context?: { api_version?: AtApiVersion }) {
    if (context?.api_version === AtApiVersion.V3) {
      return AtError._V3;
    }
    return AtError._;
  }

  // backward compatibility
  /* region statics */
  static authenticationRequired(args?: AtErrorArgs): never {
    return AtError._.authenticationRequired(args);
  }

  static apiTokenNotAllowed(args?: AtErrorArgs): never {
    return AtError._.apiTokenNotAllowed(args);
  }

  static workspaceNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.workspaceNotFound(id, args);
  }

  static orgNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.orgNotFound(id, args);
  }

  static columnAssociatedWithLink(_id: string, args: AtErrorArgs): never {
    return AtError._.columnAssociatedWithLink(_id, args);
  }

  static tableAssociatedWithLink(_id: string, args: AtErrorArgs): never {
    return AtError._.tableAssociatedWithLink(_id, args);
  }

  static baseNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.baseNotFound(id, args);
  }

  static widgetNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.widgetNotFound(id, args);
  }

  static trashNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.trashNotFound(id, args);
  }

  static parentInTrash(parentType: string, args?: AtErrorArgs): never {
    return AtError._.parentInTrash(parentType, args);
  }

  static dashboardNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.dashboardNotFound(id, args);
  }

  static interfaceNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.interfaceNotFound(id, args);
  }

  static interfacePageNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.interfacePageNotFound(id, args);
  }

  static chatSessionNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.chatSessionNotFound(id, args);
  }

  static chatMessageNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.chatMessageNotFound(id, args);
  }

  static viewSectionNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.viewSectionNotFound(id, args);
  }

  static baseSectionNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.baseSectionNotFound(id, args);
  }

  static sourceNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.sourceNotFound(id, args);
  }

  static tableNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.tableNotFound(id, args);
  }

  static userNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.userNotFound(id, args);
  }

  static teamNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.teamNotFound(id, args);
  }

  static viewNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.viewNotFound(id, args);
  }

  static filterNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.filterNotFound(id, args);
  }

  static hookNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.hookNotFound(id, args);
  }

  static genericNotFound(
    resource: string,
    id: string,
    args?: AtErrorArgs,
  ): never {
    return AtError._.genericNotFound(resource, id, args);
  }

  static requiredFieldMissing(field: string, args?: AtErrorArgs): never {
    return AtError._.requiredFieldMissing(field, args);
  }

  static duplicateRecord(id: string | string[], args?: AtErrorArgs): never {
    return AtError._.duplicateRecord(id, args);
  }

  static fieldNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.fieldNotFound(id, args);
  }

  static invalidOffsetValue(
    offset: string | number,
    args?: AtErrorArgs,
  ): never {
    return AtError._.invalidOffsetValue(offset, args);
  }
  static invalidPageValue(page: string | number, args?: AtErrorArgs): never {
    return AtError._.invalidPageValue(page, args);
  }

  static invalidPrimaryKey(
    value: any,
    pkColumn: string,
    args?: AtErrorArgs,
  ): never {
    return AtError._.invalidPrimaryKey(value, pkColumn, args);
  }

  static invalidLimitValue(args?: AtErrorArgs): never {
    return AtError._.invalidLimitValue(args);
  }

  static invalidFilter(filter: string, args?: AtErrorArgs): never {
    return AtError._.invalidFilter(filter, args);
  }

  static invalidValueForField(
    payload:
      | string
      | { value: string; column: string; type: UITypes; reason?: string },
    args?: AtErrorArgs,
  ): never {
    return AtError._.invalidValueForField(payload, args);
  }

  static invalidSharedViewPassword(args?: AtErrorArgs): never {
    return AtError._.invalidSharedViewPassword(args);
  }

  static invalidSharedDashboardPassword(args?: AtErrorArgs): never {
    return AtError._.invalidSharedDashboardPassword(args);
  }

  static invalidAttachmentJson(payload: string, args?: AtErrorArgs): never {
    return AtError._.invalidAttachmentJson(payload, args);
  }

  static notImplemented(
    feature: string = 'Feature',
    args?: AtErrorArgs,
  ): never {
    return AtError._.notImplemented(feature, args);
  }

  static internalServerError(message: string, args?: AtErrorArgs): never {
    return AtError._.internalServerError(message, args);
  }

  static systemMisconfigured(message: string, args?: AtErrorArgs): never {
    return AtError._.systemMisconfigured(message, args);
  }

  static formulaError(message: string, args?: AtErrorArgs): never {
    return AtError._.formulaError(message, args);
  }

  static formulaCircularRefError(message: string, args?: AtErrorArgs): never {
    return AtError._.formulaCircularRefError(message, args);
  }

  static unauthorized(message: string, args?: AtErrorArgs): never {
    return AtError._.unauthorized(message, args);
  }

  static forbidden(message: string, args?: AtErrorArgs): never {
    return AtError._.forbidden(message, args);
  }

  static insufficientPrivilege(message: string, args?: AtErrorArgs): never {
    return AtError._.insufficientPrivilege(message, args);
  }

  static sourceDataReadOnly(name: string): never {
    return AtError.forbidden(`Source '${name}' is read-only`);
  }

  static sourceMetaReadOnly(name: string): never {
    return AtError.forbidden(`Source '${name}' schema is read-only`);
  }

  static integrationNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.integrationNotFound(id, args);
  }

  static syncConfigNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.syncConfigNotFound(id, args);
  }

  static cannotCalculateIntermediateOrderError(): never {
    return AtError._.cannotCalculateIntermediateOrderError();
  }

  static reorderFailed(): never {
    return AtError._.reorderFailed();
  }

  static integrationLinkedWithMultiple(
    bases: BaseType[],
    sources: SourceType[],
    args?: AtErrorArgs,
  ): never {
    return AtError._.integrationLinkedWithMultiple(bases, sources, args);
  }

  static invalidAttachmentUploadScope(args?: AtErrorArgs): never {
    return AtError._.invalidAttachmentUploadScope(args);
  }

  static planLimitExceeded(
    message: string,
    details: Omit<PlanLimitExceededDetailsType, 'higherPlan'>,
    args?: AtErrorArgs,
  ): never {
    return AtError._.planLimitExceeded(message, details, args);
  }

  static creditPackNotFound(id: string, args?: AtErrorArgs): never {
    return AtError._.creditPackNotFound(id, args);
  }

  static creditsExhausted(
    details?: CreditsExhaustedDetailsType,
    args?: AtErrorArgs,
  ): never {
    return AtError._.creditsExhausted(details, args);
  }

  static allowedOnlySSOAccess(ncWorkspaceId: string): never {
    return AtError._.allowedOnlySSOAccess(ncWorkspaceId);
  }
  static allowedOnlySSOGeneratedToken(ncWorkspaceId: string): never {
    return AtError._.allowedOnlySSOGeneratedToken(ncWorkspaceId);
  }
  static mfaSetupRequired(ncWorkspaceId: string): never {
    return AtError._.mfaSetupRequired(ncWorkspaceId);
  }
  static maxPayloadLimitExceeded(limit: number, args?: AtErrorArgs): never {
    return AtError._.maxPayloadLimitExceeded(limit, args);
  }
  static baseUserError(message: string, args?: AtErrorArgs) {
    return AtError._.baseUserError(message, args);
  }

  static orgUserError(message: string, args?: AtErrorArgs) {
    return AtError._.orgUserError(message, args);
  }

  static tableError(message: string, args?: AtErrorArgs) {
    return AtError._.tableError(message, args);
  }

  static columnError(message: string, args?: AtErrorArgs) {
    return AtError._.columnError(message, args);
  }

  static maxWorkspaceLimitReached(args?: AtErrorArgs): never {
    return AtError._.maxWorkspaceLimitReached(args);
  }

  static notFound(message = 'Not found'): never {
    return AtError._.notFound(message);
  }

  static badRequest(message): never {
    return AtError._.badRequest(message);
  }

  static unprocessableEntity(message = 'Unprocessable entity'): never {
    return AtError._.unprocessableEntity(message);
  }

  static optionsNotExists(props: {
    columnTitle: string;
    options: string[];
    validOptions: string[];
  }): never {
    return AtError._.optionsNotExists(props);
  }

  static testConnectionError(
    message = 'Unprocessable entity',
    code?: string,
  ): never {
    return AtError._.testConnectionError(message, code);
  }

  static notAllowed(message = 'Not allowed'): never {
    return AtError._.notAllowed(message);
  }

  static emailDomainNotAllowed(domain: string): never {
    return AtError._.emailDomainNotAllowed(domain);
  }

  static metaError(param: { message: string; sql: string }): never {
    return AtError._.metaError(param);
  }

  static permissionDenied(
    permissionName: string,
    roles: Record<string, boolean>,
    extendedScopeRoles: any,
  ): never {
    return AtError._.permissionDenied(
      permissionName,
      roles,
      extendedScopeRoles,
    );
  }

  static recordNotFound(
    id: string | string[] | Record<string, string> | Record<string, string>[],
    args?: AtErrorArgs,
  ): never {
    return AtError._.recordNotFound(id, args);
  }

  static ajvValidationError(param: {
    message: string;
    errors: ErrorObject[];
    humanReadableError: boolean;
  }): never {
    return AtError._.ajvValidationError(param);
  }

  static externalError(message: string, args?: AtErrorArgs): never {
    return AtError._.externalError(message, args);
  }

  static externalTimeOut(message?: string, args?: AtErrorArgs): never {
    return AtError._.externalTimeOut(message, args);
  }

  static pluginTestError(message: string, args?: AtErrorArgs): never {
    return AtError._.pluginTestError(message, args);
  }
  static licenseRequired(feature?: string, args?: AtErrorArgs): never {
    return AtError._.licenseRequired(feature, args);
  }

  static licenseSuspended(args?: AtErrorArgs): never {
    return AtError._.licenseSuspended(args);
  }
  /* endregion statics */
}
