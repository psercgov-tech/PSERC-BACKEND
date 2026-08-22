import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './admin.schema';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

export const STAFF_EMAIL_DOMAIN = 'pserc.plateau.gov.ng';

@Injectable()
export class AdminsService implements OnModuleInit {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureSeedAdmin();
  }

  private async ensureSeedAdmin() {
    const email = this.configService.getOrThrow<string>('app.admin.email');
    const existing = await this.adminModel.findOne({ email }).exec();
    if (existing) return;

    const password = this.configService.getOrThrow<string>('app.admin.password');
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && (!process.env.ADMIN_PASSWORD || password === 'Admin@123456')) {
      throw new Error(
        'ADMIN_PASSWORD must be set to a unique value before first admin seed in production.',
      );
    }
    const name = this.configService.getOrThrow<string>('app.admin.name');
    const hash = await argon2.hash(password);

    await this.adminModel.create({
      email,
      password: hash,
      name,
      initials: '',
      isActive: true,
    });
  }

  private toPublic(admin: AdminDocument) {
    return {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      initials: admin.initials || '',
      isActive: admin.isActive,
      createdAt: admin.get('createdAt'),
    };
  }

  emailFromInitials(initials: string) {
    return `${initials.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
  }

  findByEmail(email: string) {
    return this.adminModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.adminModel.findById(id).exec();
  }

  async listStaff() {
    const admins = await this.adminModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    return admins.map((admin) => this.toPublic(admin));
  }

  async createStaff(dto: CreateStaffDto) {
    const initials = dto.initials.trim().toLowerCase();
    const email = this.emailFromInitials(initials);

    const existing = await this.adminModel
      .findOne({ $or: [{ email }, { initials }] })
      .exec();
    if (existing) {
      throw new ConflictException(
        `A staff account already exists for ${email}`,
      );
    }

    const password = await argon2.hash(dto.password);
    const admin = await this.adminModel.create({
      email,
      password,
      name: dto.name.trim(),
      initials,
      isActive: true,
    });

    return this.toPublic(admin);
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const admin = await this.adminModel.findById(id).exec();
    if (!admin) throw new NotFoundException('Staff account not found');

    if (dto.name !== undefined) admin.name = dto.name.trim();
    if (dto.isActive !== undefined) admin.isActive = dto.isActive;
    if (dto.password) admin.password = await argon2.hash(dto.password);

    await admin.save();
    return this.toPublic(admin);
  }

  async removeStaff(id: string) {
    const admin = await this.adminModel.findById(id).exec();
    if (!admin) throw new NotFoundException('Staff account not found');

    const seedEmail = this.configService
      .getOrThrow<string>('app.admin.email')
      .toLowerCase();
    if (admin.email === seedEmail) {
      throw new ConflictException('The primary admin account cannot be deleted');
    }

    await admin.deleteOne();
    return { ok: true };
  }
}
