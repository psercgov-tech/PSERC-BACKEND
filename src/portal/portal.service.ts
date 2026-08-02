import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from '../contacts/contact.schema';
import {
  PortalComplaintDto,
  PortalLoginDto,
  PortalRegisterDto,
} from './dto/portal.dto';
import { PortalJwtPayload } from './portal-jwt-payload';
import { PortalUser, PortalUserDocument } from './portal-user.schema';

@Injectable()
export class PortalService {
  constructor(
    @InjectModel(PortalUser.name)
    private readonly users: Model<PortalUserDocument>,
    @InjectModel(Contact.name)
    private readonly contacts: Model<ContactDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private toPublic(user: PortalUserDocument) {
    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      phone: user.phone || '',
    };
  }

  private async signToken(user: PortalUserDocument) {
    const payload: PortalJwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: 'portal',
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('app.jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'app.jwt.accessExpiresIn',
      ) as `${number}d` | `${number}h` | `${number}m`,
    });

    return accessToken;
  }

  async register(dto: PortalRegisterDto) {
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

    const accessToken = await this.signToken(user);
    return {
      accessToken,
      user: this.toPublic(user),
    };
  }

  async login(dto: PortalLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ email }).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.signToken(user);
    return {
      accessToken,
      user: this.toPublic(user),
    };
  }

  async assertUser(userId: string): Promise<PortalJwtPayload> {
    const user = await this.users.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Portal account not found');
    }
    return {
      sub: String(user._id),
      email: user.email,
      role: 'portal',
      name: user.name,
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
}
