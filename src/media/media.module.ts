import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MediaAsset, MediaSchema } from './media.schema';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MediaAsset.name, schema: MediaSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
