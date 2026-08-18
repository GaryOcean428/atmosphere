import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEvents, extractRolesObj } from 'atmosphere-sdk';
import type { AppConfig } from '~/interface/config';
import { AuthService } from '~/modules/auth/auth.service';
import { AtError } from '~/helpers/catchError';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private config: ConfigService<AppConfig>,
    private appHooksService: AppHooksService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, username: string, password: string): Promise<any> {
    if (this.config.get('auth.disableEmailAuth', { infer: true }))
      AtError.forbidden('Not available');

    const user = await this.authService.validateUser(username, password);

    if (!user) {
      this.appHooksService.emit(AppEvents.USER_SIGNIN_FAILED, {
        email: username,
        provider: 'local',
        reason: 'Invalid credentials',
        req,
      });
      AtError.badRequest('Invalid credentials');
    }

    user.roles = extractRolesObj(user.roles);

    return user;
  }
}
