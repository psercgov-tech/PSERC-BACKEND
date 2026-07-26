import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { News, NewsSchema } from './news.schema';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: News.name, schema: NewsSchema }]),
    CloudinaryModule,
  ],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
