import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from './contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  create(dto: CreateContactDto) {
    return this.contactModel.create(dto);
  }

  findAll() {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }

  async markRead(id: string) {
    const doc = await this.contactModel
      .findByIdAndUpdate(id, { isRead: true }, { new: true })
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
