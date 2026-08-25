import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateMiniGridApplicationDto,
  UpdateMiniGridApplicationDto,
} from './dto/mini-grid-application.dto';
import {
  MiniGridApplication,
  MiniGridApplicationDocument,
  MiniGridApplicationStatus,
} from './mini-grid-application.schema';

export type MiniGridApplicationClient = {
  id: string;
  companyName: string;
  physicalAddress: string;
  postalAddress: string;
  tel: string;
  mobilePhone: string;
  email: string;
  website: string;
  siteName: string;
  geoCoordinates: string;
  contactPersonName: string;
  contactPersonMobile: string;
  contactPersonEmail: string;
  status: MiniGridApplicationStatus;
  isRead: boolean;
  submittedByEmail: string;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class MiniGridApplicationsService {
  constructor(
    @InjectModel(MiniGridApplication.name)
    private readonly model: Model<MiniGridApplicationDocument>,
  ) {}

  private toClient(doc: MiniGridApplicationDocument): MiniGridApplicationClient {
    return {
      id: String(doc._id),
      companyName: doc.companyName,
      physicalAddress: doc.physicalAddress,
      postalAddress: doc.postalAddress,
      tel: doc.tel,
      mobilePhone: doc.mobilePhone,
      email: doc.email,
      website: doc.website || '',
      siteName: doc.siteName,
      geoCoordinates: doc.geoCoordinates,
      contactPersonName: doc.contactPersonName,
      contactPersonMobile: doc.contactPersonMobile,
      contactPersonEmail: doc.contactPersonEmail,
      status: doc.status,
      isRead: doc.isRead,
      submittedByEmail: doc.submittedByEmail || '',
      createdAt: doc.get('createdAt'),
      updatedAt: doc.get('updatedAt'),
    };
  }

  private normalize(
    dto: CreateMiniGridApplicationDto | UpdateMiniGridApplicationDto,
  ) {
    const out: Record<string, string> = {};
    const assign = (key: string, value?: string) => {
      if (value === undefined) return;
      out[key] = value.trim();
    };
    assign('companyName', dto.companyName);
    assign('physicalAddress', dto.physicalAddress);
    assign('postalAddress', dto.postalAddress);
    assign('tel', dto.tel);
    assign('mobilePhone', dto.mobilePhone);
    if (dto.email !== undefined) out.email = dto.email.trim().toLowerCase();
    if (dto.website !== undefined) out.website = dto.website.trim();
    assign('siteName', dto.siteName);
    assign('geoCoordinates', dto.geoCoordinates);
    assign('contactPersonName', dto.contactPersonName);
    assign('contactPersonMobile', dto.contactPersonMobile);
    if (dto.contactPersonEmail !== undefined) {
      out.contactPersonEmail = dto.contactPersonEmail.trim().toLowerCase();
    }
    return out;
  }

  async createFromPortal(
    dto: CreateMiniGridApplicationDto,
    user: { id: string; email: string },
  ) {
    const doc = await this.model.create({
      ...this.normalize(dto),
      website: dto.website?.trim() || '',
      status: 'open',
      isRead: false,
      submittedBy: new Types.ObjectId(user.id),
      submittedByEmail: user.email.trim().toLowerCase(),
    });
    return this.toClient(doc);
  }

  async listAll() {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map((d) => this.toClient(d));
  }

  async listForUser(userId: string) {
    const docs = await this.model
      .find({ submittedBy: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => this.toClient(d));
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Mini-grid application not found');
    return this.toClient(doc);
  }

  async update(id: string, dto: UpdateMiniGridApplicationDto) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Mini-grid application not found');

    Object.assign(doc, this.normalize(dto));
    if (dto.status) {
      doc.status = dto.status;
      doc.isRead = dto.status !== 'open';
    }
    await doc.save();
    return this.toClient(doc);
  }

  async updateStatus(id: string, status: MiniGridApplicationStatus) {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { status, isRead: status !== 'open' },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('Mini-grid application not found');
    return this.toClient(doc);
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Mini-grid application not found');
    return { deleted: true };
  }
}
