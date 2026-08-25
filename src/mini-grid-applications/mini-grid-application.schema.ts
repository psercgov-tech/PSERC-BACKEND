import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MiniGridApplicationDocument =
  HydratedDocument<MiniGridApplication>;

export type MiniGridApplicationStatus = 'open' | 'pending' | 'resolved';

@Schema({ timestamps: true })
export class MiniGridApplication {
  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, trim: true })
  physicalAddress: string;

  @Prop({ required: true, trim: true })
  postalAddress: string;

  @Prop({ required: true, trim: true })
  tel: string;

  @Prop({ required: true, trim: true })
  mobilePhone: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true, default: '' })
  website: string;

  @Prop({ required: true, trim: true })
  siteName: string;

  @Prop({ required: true, trim: true })
  geoCoordinates: string;

  @Prop({ required: true, trim: true })
  contactPersonName: string;

  @Prop({ required: true, trim: true })
  contactPersonMobile: string;

  @Prop({ required: true, lowercase: true, trim: true })
  contactPersonEmail: string;

  @Prop({
    required: true,
    enum: ['open', 'pending', 'resolved'],
    default: 'open',
    index: true,
  })
  status: MiniGridApplicationStatus;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Types.ObjectId, ref: 'PortalUser', index: true })
  submittedBy?: Types.ObjectId;

  @Prop({ lowercase: true, trim: true, default: '' })
  submittedByEmail: string;
}

export const MiniGridApplicationSchema =
  SchemaFactory.createForClass(MiniGridApplication);
