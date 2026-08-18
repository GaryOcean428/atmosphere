import { AtBaseErrorv2, AtErrorType } from 'atmosphere-sdk';
import { AtErrorV1 } from './AtErrorV1';
import type { ErrorObject } from 'ajv';

export class AjvErrorV3 extends AtBaseErrorv2 {
  humanReadableError: boolean;
  constructor(param: {
    message: string;
    errors: ErrorObject[];
    humanReadableError?: boolean;
  }) {
    super(param.message, 400, AtErrorType.ERR_INVALID_REQUEST_BODY, {
      details: param.errors,
    });
    this.errors = param.errors;
    this.humanReadableError = param.humanReadableError || false;
  }

  errors: ErrorObject[];
}

export class AtErrorV3 extends AtErrorV1 {
  constructor() {
    super();
    this.errorCodex.setErrorCodexes({
      [AtErrorType.ERR_INVALID_FILTER]: {
        message: (message: string) => `Invalid filter expression: ${message}`,
        code: 422,
      },
      [AtErrorType.ERR_BASE_NOT_FOUND]: {
        message: (id: string) => `Base '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_TABLE_NOT_FOUND]: {
        message: (id: string) => `Table '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_VIEW_NOT_FOUND]: {
        message: (id: string) => `View '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_FIELD_NOT_FOUND]: {
        message: (id: string) => `Field ${id} not found`,
        code: 422,
      },
      [AtErrorType.ERR_FILTER_NOT_FOUND]: {
        message: (id: string) => `Filter '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_TEAM_NOT_FOUND]: {
        message: (id: string) => `Team '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_USER_NOT_FOUND]: {
        message: (id: string) => `User '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_EXTENSION_NOT_FOUND]: {
        message: (id: string) => `Extension '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_DASHBOARD_NOT_FOUND]: {
        message: (id: string) => `Dashboard '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_WIDGET_NOT_FOUND]: {
        message: (id: string) => `Widget '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_WORKFLOW_NOT_FOUND]: {
        message: (id: string) => `Workflow '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_SCRIPT_NOT_FOUND]: {
        message: (id: string) => `Script '${id}' not found`,
        code: 422,
      },
      [AtErrorType.ERR_RLS_POLICY_NOT_FOUND]: {
        message: (id: string) => `RLS Policy '${id}' not found`,
        code: 422,
      },
    });
  }

  override ajvValidationError(param: {
    message: string;
    errors: ErrorObject[];
    humanReadableError: boolean;
  }): never {
    throw new AjvErrorV3(param);
  }

  override invalidRequestBody(message: string): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_INVALID_REQUEST_BODY, {
      params: message,
    });
  }

  override teamNotFound(id: string, args?: any): never {
    throw this.errorCodex.generateError(AtErrorType.ERR_TEAM_NOT_FOUND, {
      params: id,
      ...args,
    });
  }
}
