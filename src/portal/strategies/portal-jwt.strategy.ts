import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PortalJwtPayload } from '../portal-jwt-payload';
import { PortalService } from '../portal.service';

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(
  Strategy,
  'portal-jwt',
) {
  constructor(
    configService: ConfigService,
    private readonly portalService: PortalService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('app.jwt.accessSecret'),
    });
  }

  async validate(payload: PortalJwtPayload) {
    if (!payload?.sub || payload.role !== 'portal') {
      throw new UnauthorizedException('Invalid portal session');
    }
    return this.portalService.assertUser(payload.sub);
  }
}
