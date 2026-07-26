import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';
import { News, NewsDocument } from './news.schema';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name) private readonly newsModel: Model<NewsDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  findPublished() {
    return this.newsModel
      .find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .exec();
  }

  findAll() {
    return this.newsModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.newsModel.findById(id).exec();
    if (!doc) throw new NotFoundException('News item not found');
    return doc;
  }

  async create(dto: CreateNewsDto, file?: Express.Multer.File) {
    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    if (file) {
      if (!this.cloudinaryService.isConfigured()) {
        throw new BadRequestException('Cloudinary is not configured');
      }
      const uploaded = await this.cloudinaryService.uploadImage(file, 'news');
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    }

    return this.newsModel.create({
      ...dto,
      category: dto.category ?? 'News',
      published: dto.published ?? true,
      publishedAt: dto.published === false ? undefined : new Date(),
      imageUrl,
      imagePublicId,
    });
  }

  async update(id: string, dto: UpdateNewsDto, file?: Express.Multer.File) {
    const doc = await this.findOne(id);

    if (file) {
      if (!this.cloudinaryService.isConfigured()) {
        throw new BadRequestException('Cloudinary is not configured');
      }
      if (doc.imagePublicId) {
        await this.cloudinaryService.deleteAsset(doc.imagePublicId);
      }
      const uploaded = await this.cloudinaryService.uploadImage(file, 'news');
      doc.imageUrl = uploaded.secure_url;
      doc.imagePublicId = uploaded.public_id;
    }

    Object.assign(doc, dto);
    if (dto.published === true && !doc.publishedAt) {
      doc.publishedAt = new Date();
    }
    return doc.save();
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    if (doc.imagePublicId) {
      await this.cloudinaryService.deleteAsset(doc.imagePublicId);
    }
    await doc.deleteOne();
    return { deleted: true };
  }
}
