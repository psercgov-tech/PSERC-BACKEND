import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
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
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: PortalJwtPayload) {
    if (!payload?.sub || payload.role !== 'portal') {
      throw new UnauthorizedException('Invalid portal session');
    }

    const deviceBinding = req.header('x-device-binding') || undefined;
    const fingerprint = req.header('x-device-fingerprint') || undefined;
    const userAgent = req.header('user-agent') || undefined;

    try {
      return await this.portalService.assertSession(
        payload,
        deviceBinding,
        fingerprint,
        userAgent,
      );
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid session');
    }
  }
}
