import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MediaAsset, MediaDocument } from './media.schema';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(MediaAsset.name)
    private readonly mediaModel: Model<MediaDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  findAll() {
    return this.mediaModel.find().sort({ createdAt: -1 }).exec();
  }

  async upload(file: Express.Multer.File, folder = 'media') {
    if (!file) throw new BadRequestException('File is required');
    if (!this.cloudinaryService.isConfigured()) {
      throw new BadRequestException('Cloudinary is not configured');
    }

    const uploaded = await this.cloudinaryService.uploadImage(file, folder);
    return this.mediaModel.create({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      originalName: file.originalname,
      format: uploaded.format,
      bytes: uploaded.bytes,
      folder,
    });
  }

  async remove(id: string) {
    const doc = await this.mediaModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Media not found');
    await this.cloudinaryService.deleteAsset(doc.publicId);
    await doc.deleteOne();
    return { deleted: true };
  }
}
