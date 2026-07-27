import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Contact,
  ContactDocument,
  ContactStatus,
  ContactType,
} from './contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService implements OnModuleInit {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async onModuleInit() {
    await this.contactModel.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'inquiry' } },
    );
    await this.contactModel.updateMany(
      { status: { $exists: false }, isRead: false },
      { $set: { status: 'open' } },
    );
    await this.contactModel.updateMany(
      { status: { $exists: false }, isRead: true },
      { $set: { status: 'pending' } },
    );
  }

  create(dto: CreateContactDto) {
    const type: ContactType = dto.type || 'inquiry';
    return this.contactModel.create({
      name: dto.name,
      email: dto.email,
      message: dto.message,
      type,
      status: 'open',
      isRead: false,
    });
  }

  findAll() {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }

  findComplaints() {
    return this.contactModel
      .find({ type: 'complaint' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markRead(id: string) {
    const doc = await this.contactModel
      .findByIdAndUpdate(
        id,
        { isRead: true, status: 'pending' },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('Contact message not found');
    return doc;
  }

  async updateStatus(id: string, status: ContactStatus) {
    const doc = await this.contactModel
      .findByIdAndUpdate(
        id,
        {
          status,
          isRead: status !== 'open',
        },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('Contact message not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.contactModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Contact message not found');
    return { deleted: true };
  }
}
