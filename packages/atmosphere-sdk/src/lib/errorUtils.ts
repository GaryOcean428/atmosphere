import { AtErrorType } from './globals';

export class AtSDKError extends Error {
  constructor(message: string) {
    super(message);
  }
}
export interface AtSDKErrorV2Info {
  message: string;
  error: AtErrorType;
  getStatus?: () => number;
}
export class AtSDKErrorV2 extends Error {
  constructor(info: AtSDKErrorV2Info) {
    super(info.message);
    this.getStatus = info.getStatus;
    this.errorType = info.error;
  }
  info: AtSDKErrorV2Info;
  getStatus?: () => number;
  errorType: AtErrorType;
}

export class BadRequest extends AtSDKError {}
