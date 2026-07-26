import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './admin.schema';

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
    const name = this.configService.getOrThrow<string>('app.admin.name');
    const hash = await argon2.hash(password);

    await this.adminModel.create({
      email,
      password: hash,
      name,
      isActive: true,
    });
  }

  findByEmail(email: string) {
    return this.adminModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.adminModel.findById(id).exec();
  }
}
