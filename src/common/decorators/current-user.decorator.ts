import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../auth/jwt-payload';
import { PortalJwtPayload } from '../../portal/portal-jwt-payload';

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): JwtPayload | PortalJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
