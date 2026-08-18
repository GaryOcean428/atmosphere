import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { User } from '~/models';
import { UsersService } from '~/services/users/users.service';
import { AtError } from '~/helpers/ncError';
import Atmosphere from '~/Atmosphere';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(options, private userService: UsersService) {
    super({
      expiresIn: '10h',
      ...options,
    });
  }

  async validate(req, jwtPayload) {
    if (
      !jwtPayload?.email ||
      jwtPayload?.is_api_token ||
      jwtPayload?.is_oauth_token
    )
      return jwtPayload;

    const user = await User.getByEmail(jwtPayload?.email);

    if (!user) {
      AtError.get().unauthorized('Token Expired. Please login again.');
    }

    if (
      !user.token_version ||
      !jwtPayload.token_version ||
      user.token_version !== jwtPayload.token_version
    ) {
      AtError.get().unauthorized('Token Expired. Please login again.');
    }
    const userWithRoles = await User.getWithRoles(req.context, user.id, {
      user,
      baseId: req.ncBaseId,
      workspaceId: req.ncWorkspaceId || Atmosphere.ncDefaultWorkspaceId || undefined,
    });

    return userWithRoles && { ...userWithRoles, isAuthorized: true };
  }
}
