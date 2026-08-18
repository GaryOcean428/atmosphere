import { DBErrorExtractor } from './db-error/extractor';
import type { AtContext } from 'atmosphere-sdk';
import type { ClientType } from 'atmosphere-sdk';
export {
  AtBaseError,
  AtBaseErrorv2,
  AtErrorArgs,
  OptionsNotExistsError,
  BadRequestV2 as BadRequest,
  MetaError,
  SsoError,
  NotFound,
  UnprocessableEntity,
  Unauthorized,
  TestConnectionError,
  Forbidden,
  ExternalError,
  ExternalTimeout,
} from 'atmosphere-sdk';
// Import UniqueConstraintViolationError directly from error module
// as it may not be exported from the main SDK index
export { UniqueConstraintViolationError } from 'atmosphere-sdk';
export { AjvError, AtError } from '~/helpers/ncError';

// extract db errors using database error code
export function extractDBError(
  error,
  context?: AtContext & {
    clientType?: ClientType;
  },
):
  | {
      message: string;
      error: string;
      details?: any;
      code?: string;
      httpStatus: number;
    }
  | undefined {
  return DBErrorExtractor.get().extractDbError(error, context);
}
