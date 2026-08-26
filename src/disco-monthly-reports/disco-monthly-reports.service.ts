import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateDiscoMonthlyReportDto } from './dto/disco-monthly-report.dto';
import {
  DiscoMonthlyReport,
  DiscoMonthlyReportDocument,
  DiscoMonthlyReportStatus,
} from './disco-monthly-report.schema';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_BYTES = 15 * 1024 * 1024;

export type DiscoMonthlyReportClient = {
  id: string;
  discoName: string;
  reportMonth: number;
  reportYear: number;
  notes: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  bytes: number;
  status: DiscoMonthlyReportStatus;
  isRead: boolean;
  submittedByEmail: string;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class DiscoMonthlyReportsService {
  constructor(
    @InjectModel(DiscoMonthlyReport.name)
    private readonly model: Model<DiscoMonthlyReportDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private toClient(doc: DiscoMonthlyReportDocument): DiscoMonthlyReportClient {
    return {
      id: String(doc._id),
      discoName: doc.discoName,
      reportMonth: doc.reportMonth,
      reportYear: doc.reportYear,
      notes: doc.notes || '',
      fileUrl: doc.fileUrl,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      bytes: doc.bytes,
      status: doc.status,
      isRead: doc.isRead,
      submittedByEmail: doc.submittedByEmail || '',
      createdAt: doc.get('createdAt'),
      updatedAt: doc.get('updatedAt'),
    };
  }

  private assertDocx(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('A DOCX file is required');
    }
    const name = (file.originalname || '').toLowerCase();
    if (!name.endsWith('.docx')) {
      throw new BadRequestException('Only .docx Word documents are allowed');
    }
    const mime = (file.mimetype || '').toLowerCase();
    const mimeOk =
      !mime ||
      mime === DOCX_MIME ||
      mime === 'application/octet-stream' ||
      mime === 'application/zip' ||
      mime === 'application/x-zip-compressed';
    if (!mimeOk) {
      throw new BadRequestException('Only .docx Word documents are allowed');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File must be 15 MB or smaller');
    }
  }

  async createFromPortal(
    dto: CreateDiscoMonthlyReportDto,
    file: Express.Multer.File | undefined,
    user: { id: string; email: string },
  ) {
    this.assertDocx(file);
    if (!this.cloudinaryService.isConfigured()) {
      throw new BadRequestException('File upload is not configured');
    }

    const uploaded = await this.cloudinaryService.uploadImage(
      file!,
      'disco-reports',
    );

    const doc = await this.model.create({
      discoName: dto.discoName.trim(),
      reportMonth: dto.reportMonth,
      reportYear: dto.reportYear,
      notes: dto.notes?.trim() || '',
      fileUrl: uploaded.secure_url,
      filePublicId: uploaded.public_id,
      originalName: file!.originalname,
      mimeType: file!.mimetype || DOCX_MIME,
      bytes: uploaded.bytes ?? file!.size,
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
    if (!doc) throw new NotFoundException('DISCO monthly report not found');
    return this.toClient(doc);
  }

  async updateStatus(id: string, status: DiscoMonthlyReportStatus) {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { status, isRead: status !== 'open' },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('DISCO monthly report not found');
    return this.toClient(doc);
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('DISCO monthly report not found');
    if (doc.filePublicId) {
      await this.cloudinaryService.deleteAsset(doc.filePublicId);
    }
    return { deleted: true };
  }
}
