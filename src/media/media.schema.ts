import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MediaDocument = HydratedDocument<MediaAsset>;

@Schema({ timestamps: true })
export class MediaAsset {
  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ required: true, trim: true })
  publicId: string;

  @Prop({ trim: true })
  originalName?: string;

  @Prop({ trim: true })
  format?: string;

  @Prop()
  bytes?: number;

  @Prop({ default: 'general', trim: true })
  folder: string;
}

export const MediaSchema = SchemaFactory.createForClass(MediaAsset);
