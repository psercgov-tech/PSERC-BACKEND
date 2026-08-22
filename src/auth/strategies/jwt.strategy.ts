import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../jwt-payload';

export type { JwtPayload };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('app.jwt.accessSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (payload?.role !== 'admin') {
      throw new UnauthorizedException('Invalid session token');
    }

    const headerBinding = req.header('x-device-binding') || undefined;
    const deviceBinding = headerBinding;
    const fingerprint = req.header('x-device-fingerprint') || undefined;
    const userAgent = req.header('user-agent') || undefined;

    try {
      return await this.authService.assertSession(
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
