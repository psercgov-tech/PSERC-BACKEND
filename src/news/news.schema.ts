import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NewsDocument = HydratedDocument<News>;

@Schema({ timestamps: true })
export class News {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  excerpt: string;

  @Prop({ trim: true })
  body?: string;

  @Prop({ default: 'News', trim: true })
  category: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ trim: true })
  imagePublicId?: string;

  @Prop({ default: true })
  published: boolean;

  @Prop()
  publishedAt?: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);
