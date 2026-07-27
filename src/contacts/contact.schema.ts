import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContactDocument = HydratedDocument<Contact>;

export type ContactType = 'complaint' | 'inquiry' | 'general';
export type ContactStatus = 'open' | 'pending' | 'resolved';

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    required: true,
    enum: ['complaint', 'inquiry', 'general'],
    default: 'inquiry',
    index: true,
  })
  type: ContactType;

  @Prop({
    required: true,
    enum: ['open', 'pending', 'resolved'],
    default: 'open',
    index: true,
  })
  status: ContactStatus;

  @Prop({ default: false })
  isRead: boolean;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
