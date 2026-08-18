import { AtErrorType } from '~/lib/globals';

export class AtBaseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BadRequestV2 extends AtBaseError {}

export class NotAllowed extends AtBaseError {}

export class Unauthorized extends AtBaseError {}

export class Forbidden extends AtBaseError {}

export class NotFound extends AtBaseError {}

export class SsoError extends AtBaseError {}

export class MetaError extends AtBaseError {
  constructor(param: { message: string; sql: string }) {
    super(param.message);
    Object.assign(this, param);
  }
}

export class ExternalError extends AtBaseError {
  constructor(error: Error) {
    super(error.message);
    Object.assign(this, error);
  }
}

export class ExternalTimeout extends ExternalError {}

export class UnprocessableEntity extends AtBaseError {}

export class OptionsNotExistsError extends BadRequestV2 {
  constructor({
    columnTitle,
    options,
    validOptions,
  }: {
    columnTitle: string;
    options: string[];
    validOptions: string[];
  }) {
    super(
      `Invalid option(s) "${options.join(
        ', '
      )}" provided for column "${columnTitle}". Valid options are "${validOptions.join(
        ', '
      )}"`
    );
    this.columnTitle = columnTitle;
    this.options = options;
    this.validOptions = validOptions;
  }
  columnTitle: string;
  options: string[];
  validOptions: string[];
}

export class UniqueConstraintViolationError extends BadRequestV2 {
  constructor({ value, fieldName }: { value: string; fieldName: string }) {
    let message = `${fieldName} field unique constraint violation. Value '${value}' already exists.`;

    if (value === 'unknown') {
      message = `${fieldName} field unique constraint violation.`;
    }

    super(message);
    this.value = value;
    this.fieldName = fieldName;
  }
  value: string;
  fieldName: string;
}

export class TestConnectionError extends AtBaseError {
  public sql_code?: string;

  constructor(message: string, sql_code?: string) {
    super(message);
    this.sql_code = sql_code;
  }
}

export type AtErrorArgs = {
  params?: string | string[];
  customMessage?: string | ((...args: string[]) => string);
  details?: any;
};

export class AtBaseErrorv2 extends AtBaseError {
  error: AtErrorType;
  code: number;
  details?: any;

  constructor(
    message: string,
    code: number,
    error: AtErrorType,
    args?: AtErrorArgs
  ) {
    super(message);
    this.error = error;
    this.code = code;
    this.details = args?.details;
  }
}
