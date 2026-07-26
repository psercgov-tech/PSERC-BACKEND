import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AdminsService } from '../admins/admins.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.adminsService.findByEmail(dto.email);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(admin.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: 'admin',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('app.jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'app.jwt.accessExpiresIn',
      ) as `${number}d` | `${number}h` | `${number}m`,
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
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
}
