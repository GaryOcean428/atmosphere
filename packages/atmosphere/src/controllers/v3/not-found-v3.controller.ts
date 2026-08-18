import { All, Controller, HttpCode, Req } from '@nestjs/common';
import { AtRequest } from 'atmosphere-sdk';

const NOT_FOUND_PATH_PREFIX = '/api/v3/*';

@Controller()
export class NotFoundV3Controller {
  @All(NOT_FOUND_PATH_PREFIX)
  @HttpCode(404)
  async notFoundV3(@Req() req: AtRequest) {
    return {
      error: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    };
  }
}
