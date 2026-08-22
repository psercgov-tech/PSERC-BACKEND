import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Response } from 'express';
import { Model } from 'mongoose';
import { AdminsService } from '../admins/admins.service';
import { AdminSession, AdminSessionDocument } from './admin-session.schema';
import { LoginDto } from './dto/login.dto';
import {
  createDeviceBinding,
  createSessionId,
  normalizeUserAgent,
  safeEqual,
  sha256,
} from './session-crypto';
import { JwtPayload } from './jwt-payload';

export const DEVICE_COOKIE = 'pserc_device';
export type { JwtPayload };

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(AdminSession.name)
    private readonly sessions: Model<AdminSessionDocument>,
  ) {}

  private bindingPepper(): string {
    return this.configService.getOrThrow<string>('app.jwt.accessSecret');
  }

  private hashBinding(binding: string): string {
    return sha256(`${this.bindingPepper()}:${binding}`);
  }

  private hashFingerprint(fingerprint: string): string {
    return sha256(`fp:${fingerprint.trim().toLowerCase()}`);
  }

  private sessionTtlMs(): number {
    const raw =
      this.configService.get<string>('app.jwt.accessExpiresIn') ?? '8h';
    const match = /^(\d+)([smhd])$/i.exec(raw.trim());
    if (!match) return 8 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = match[2].toLowerCase();
    const mult =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : 86_400_000;
    return n * mult;
  }

  private cookieSecure(): boolean {
    return this.configService.get<boolean>('app.cookie.secure') ?? false;
  }

  private cookieSameSite(): 'lax' | 'none' | 'strict' {
    return this.configService.get<'lax' | 'none' | 'strict'>(
      'app.cookie.sameSite',
    ) ?? 'lax';
  }

  clearDeviceCookie(res: Response) {
    res.clearCookie(DEVICE_COOKIE, {
      httpOnly: true,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      path: '/',
    });
  }

  async login(
    dto: LoginDto,
    userAgent: string | undefined,
    res: Response,
  ) {
    const admin = await this.adminsService.findByEmail(dto.email);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(admin.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const fingerprint = dto.deviceFingerprint?.trim();
    if (!fingerprint || fingerprint.length < 16) {
      throw new UnauthorizedException('Device verification failed');
    }

    // One active console session per admin — new login revokes others.
    await this.sessions.updateMany(
      { adminId: admin.id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );

    const sessionId = createSessionId();
    const deviceBinding = createDeviceBinding();
    const ttlMs = this.sessionTtlMs();
    const expiresAt = new Date(Date.now() + ttlMs);
    const ua = normalizeUserAgent(userAgent);
    const fingerprintHash = this.hashFingerprint(fingerprint);

    await this.sessions.create({
      sessionId,
      adminId: admin.id,
      deviceBindingHash: this.hashBinding(deviceBinding),
      fingerprintHash,
      userAgent: ua,
      expiresAt,
      lastSeenAt: new Date(),
    });

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: 'admin',
      sid: sessionId,
      fp: fingerprintHash,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('app.jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'app.jwt.accessExpiresIn',
      ) as `${number}d` | `${number}h` | `${number}m`,
    });

    this.clearDeviceCookie(res);

    return {
      accessToken,
      // Returned once so the SPA can send it when cross-site cookies are blocked.
      // Alone it is useless without matching JWT + fingerprint + this browser.
      deviceBinding,
      expiresAt: expiresAt.toISOString(),
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  async logout(sessionId: string | undefined, res: Response) {
    if (sessionId) {
      await this.sessions.updateOne(
        { sessionId },
        { $set: { revokedAt: new Date() } },
      );
    }
    this.clearDeviceCookie(res);
    return { ok: true };
  }

  async me(adminId: string) {
    const admin = await this.adminsService.findById(adminId);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin not found');
    }
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };
  }

  async assertSession(
    payload: JwtPayload,
    deviceBinding: string | undefined,
    fingerprint: string | undefined,
    userAgent: string | undefined,
  ): Promise<JwtPayload> {
    if (!payload?.sid || !payload?.fp || !payload?.sub) {
      throw new UnauthorizedException('Invalid session token');
    }

    if (!deviceBinding) {
      throw new UnauthorizedException(
        'Session is bound to the original browser. Please sign in again.',
      );
    }

    if (!fingerprint) {
      throw new UnauthorizedException('Device verification failed');
    }

    const session = await this.sessions.findOne({ sessionId: payload.sid });
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    if (String(session.adminId) !== String(payload.sub)) {
      throw new UnauthorizedException('Invalid session token');
    }

    const bindingHash = this.hashBinding(deviceBinding);
    if (!safeEqual(bindingHash, session.deviceBindingHash)) {
      throw new UnauthorizedException(
        'Token is not valid in this browser. Please sign in again.',
      );
    }

    const fingerprintHash = this.hashFingerprint(fingerprint);
    if (
      !safeEqual(fingerprintHash, session.fingerprintHash) ||
      !safeEqual(fingerprintHash, payload.fp)
    ) {
      throw new UnauthorizedException(
        'Token is not valid in this browser. Please sign in again.',
      );
    }

    const ua = normalizeUserAgent(userAgent);
    if (session.userAgent && ua && session.userAgent !== ua) {
      throw new UnauthorizedException(
        'Token is not valid in this browser. Please sign in again.',
      );
    }

    session.lastSeenAt = new Date();
    await session.save();

    return payload;
  }
}
