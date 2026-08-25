import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model, Types } from 'mongoose';
import {
  createDeviceBinding,
  createSessionId,
  normalizeUserAgent,
  safeEqual,
  sha256,
} from '../auth/session-crypto';
import { Contact, ContactDocument } from '../contacts/contact.schema';
import { EmailService } from '../email/email.service';
import { MiniGridApplicationsService } from '../mini-grid-applications/mini-grid-applications.service';
import { CreateMiniGridApplicationDto } from '../mini-grid-applications/dto/mini-grid-application.dto';
import {
  PortalComplaintDto,
  PortalForgotPasswordDto,
  PortalLoginDto,
  PortalRegisterDto,
  PortalResetPasswordDto,
} from './dto/portal.dto';
import { PortalJwtPayload } from './portal-jwt-payload';
import {
  PortalSession,
  PortalSessionDocument,
} from './portal-session.schema';
import { PortalUser, PortalUserDocument } from './portal-user.schema';

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(
    @InjectModel(PortalUser.name)
    private readonly users: Model<PortalUserDocument>,
    @InjectModel(PortalSession.name)
    private readonly sessions: Model<PortalSessionDocument>,
    @InjectModel(Contact.name)
    private readonly contacts: Model<ContactDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly miniGridApplications: MiniGridApplicationsService,
  ) {}

  private toPublic(user: PortalUserDocument) {
    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      phone: user.phone || '',
    };
  }

  private bindingPepper(): string {
    return this.configService.getOrThrow<string>('app.jwt.accessSecret');
  }

  private hashBinding(binding: string): string {
    return sha256(`${this.bindingPepper()}:portal:${binding}`);
  }

  private hashFingerprint(fingerprint: string): string {
    return sha256(`portal-fp:${fingerprint.trim().toLowerCase()}`);
  }

  private sessionTtlMs(): number {
    const raw =
      this.configService.get<string>('app.jwt.accessExpiresIn') ?? '4h';
    const match = /^(\d+)([smhd])$/i.exec(raw.trim());
    if (!match) return 4 * 60 * 60 * 1000;
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

  private async issueSession(
    user: PortalUserDocument,
    fingerprint: string,
    userAgent: string | undefined,
  ) {
    if (!fingerprint || fingerprint.length < 16) {
      throw new UnauthorizedException('Device verification failed');
    }

    await this.sessions.updateMany(
      { userId: user._id, revokedAt: { $exists: false } },
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
      userId: user._id,
      deviceBindingHash: this.hashBinding(deviceBinding),
      fingerprintHash,
      userAgent: ua,
      expiresAt,
      lastSeenAt: new Date(),
    });

    const payload: PortalJwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: 'portal',
      name: user.name,
      sid: sessionId,
      fp: fingerprintHash,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('app.jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'app.jwt.accessExpiresIn',
      ) as `${number}d` | `${number}h` | `${number}m`,
    });

    return {
      accessToken,
      deviceBinding,
      expiresAt: expiresAt.toISOString(),
      user: this.toPublic(user),
    };
  }

  async register(dto: PortalRegisterDto, userAgent: string | undefined) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const password = await argon2.hash(dto.password);
    const user = await this.users.create({
      email,
      password,
      name: dto.name.trim(),
      phone: dto.phone?.trim() || '',
      isActive: true,
    });

    return this.issueSession(user, dto.deviceFingerprint, userAgent);
  }

  async login(dto: PortalLoginDto, userAgent: string | undefined) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ email }).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user, dto.deviceFingerprint, userAgent);
  }

  async logout(sessionId: string | undefined) {
    if (sessionId) {
      await this.sessions.updateOne(
        { sessionId },
        { $set: { revokedAt: new Date() } },
      );
    }
    return { ok: true };
  }

  async assertSession(
    payload: PortalJwtPayload,
    deviceBinding: string | undefined,
    fingerprint: string | undefined,
    userAgent: string | undefined,
  ): Promise<PortalJwtPayload> {
    if (!payload?.sid || !payload?.fp || !payload?.sub) {
      throw new UnauthorizedException('Invalid session token');
    }

    if (!deviceBinding) {
      throw new UnauthorizedException(
        'Session is bound to the original browser tab. Please sign in again.',
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

    if (String(session.userId) !== String(payload.sub)) {
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

    const user = await this.users.findById(payload.sub).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Portal account not found');
    }

    session.lastSeenAt = new Date();
    await session.save();

    return {
      sub: String(user._id),
      email: user.email,
      role: 'portal',
      name: user.name,
      sid: payload.sid,
      fp: payload.fp,
    };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Portal account not found');
    }
    return this.toPublic(user);
  }

  async createComplaint(userId: string, dto: PortalComplaintDto) {
    const user = await this.users.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Portal account not found');
    }

    const contact = await this.contacts.create({
      name: user.name,
      email: user.email,
      message: dto.message.trim(),
      type: dto.type || 'complaint',
      status: 'open',
      isRead: false,
    });

    return {
      id: String(contact._id),
      type: contact.type,
      status: contact.status,
      message: contact.message,
      createdAt: contact.get('createdAt'),
    };
  }

  async listComplaints(userId: string) {
    const user = await this.users.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Portal account not found');
    }

    const items = await this.contacts
      .find({ email: user.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    return items.map((item) => ({
      id: String(item._id),
      type: item.type,
      status: item.status,
      message: item.message,
      isRead: item.isRead,
      createdAt: item.get('createdAt'),
    }));
  }

  async createMiniGridApplication(
    userId: string,
    dto: CreateMiniGridApplicationDto,
  ) {
    const user = await this.users.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Portal account not found');
    }
    return this.miniGridApplications.createFromPortal(dto, {
      id: String(user._id),
      email: user.email,
    });
  }

  async listMiniGridApplications(userId: string) {
    const user = await this.users.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Portal account not found');
    }
    return this.miniGridApplications.listForUser(String(user._id));
  }

  async forgotPassword(
    dto: PortalForgotPasswordDto,
  ): Promise<{ message: string; emailWarning?: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ email }).exec();
    if (!user || !user.isActive) {
      throw new NotFoundException('No portal account found for this email.');
    }
    if (!this.emailService.isConfigured()) {
      this.logger.warn('[email] forgotPassword: email service is not configured');
      throw new ServiceUnavailableException(
        'Password reset email is temporarily unavailable. Please try again later.',
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.users
      .findByIdAndUpdate(user._id, {
        $set: {
          passwordResetToken: code,
          passwordResetExpires: expiresAt,
        },
        $unset: { resetUrlToken: '' },
      })
      .exec();

    try {
      await Promise.race([
        this.emailService.sendPasswordResetEmail(
          user.email,
          user.name,
          code,
        ),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Password reset email timed out')),
            20_000,
          );
        }),
      ]);
    } catch (err) {
      this.logger.error(
        `[email] Password reset email failed for ${user.email}: ${
          err instanceof Error ? err.message : String(err)
        }`,
        err instanceof Error ? err.stack : undefined,
      );
      return {
        message:
          'Your reset code was created. If you do not receive an email shortly, request a new code.',
        emailWarning:
          'The reset email could not be delivered right away. You can still enter a code if you received one, or request a new code.',
      };
    }
    return { message: 'A 6-digit reset code has been sent to your email.' };
  }

  async resetPassword(
    dto: PortalResetPasswordDto,
  ): Promise<{ message: string }> {
    const email = dto.email?.trim().toLowerCase();
    const code = dto.code?.trim();
    const legacy = dto.token?.trim();
    const uid = dto.uid?.trim();
    const reset = dto.reset?.trim();
    const hasOtp = !!(email && code);
    const hasPair = !!(uid && reset);
    const hasLegacy = !!legacy;

    if (!hasOtp && !hasLegacy && !hasPair) {
      throw new BadRequestException(
        'Provide email and 6-digit code, or a valid legacy reset token.',
      );
    }
    if ([hasOtp, hasLegacy, hasPair].filter(Boolean).length > 1) {
      throw new BadRequestException(
        'Provide only one reset method: email+code, token, or uid+reset.',
      );
    }

    let user: PortalUserDocument | null = null;
    if (hasOtp) {
      user = await this.users
        .findOne({
          email,
          passwordResetToken: code,
          passwordResetExpires: { $gt: new Date() },
        })
        .exec();
    } else if (hasLegacy) {
      user = await this.users
        .findOne({
          passwordResetToken: legacy,
          passwordResetExpires: { $gt: new Date() },
        })
        .exec();
    } else if (Types.ObjectId.isValid(uid!)) {
      user = await this.users
        .findOne({
          _id: uid,
          resetUrlToken: reset,
          passwordResetExpires: { $gt: new Date() },
        })
        .exec();
    }

    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const password = await argon2.hash(dto.newPassword);
    await this.users
      .findByIdAndUpdate(user._id, {
        $set: { password },
        $unset: {
          passwordResetToken: '',
          passwordResetExpires: '',
          resetUrlToken: '',
        },
      })
      .exec();

    await this.sessions.updateMany(
      { userId: user._id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );

    if (this.emailService.isConfigured()) {
      try {
        await this.emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (err) {
        this.logger.error(
          `[email] password_changed_notify failed for ${user.email}: ${
            err instanceof Error ? err.message : String(err)
          }`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }

    return { message: 'Password has been reset successfully' };
  }
}
