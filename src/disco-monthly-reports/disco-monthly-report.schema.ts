import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DiscoMonthlyReportDocument = HydratedDocument<DiscoMonthlyReport>;

export type DiscoMonthlyReportStatus = 'open' | 'pending' | 'resolved';

@Schema({ timestamps: true })
export class DiscoMonthlyReport {
  @Prop({ required: true, trim: true })
  discoName: string;

  @Prop({ required: true, min: 1, max: 12 })
  reportMonth: number;

  @Prop({ required: true, min: 2000, max: 2100 })
  reportYear: number;

  @Prop({ trim: true, default: '' })
  notes: string;

  @Prop({ required: true, trim: true })
  fileUrl: string;

  @Prop({ required: true, trim: true })
  filePublicId: string;

  @Prop({ required: true, trim: true })
  originalName: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ required: true, default: 0 })
  bytes: number;

  @Prop({
    required: true,
    enum: ['open', 'pending', 'resolved'],
    default: 'open',
    index: true,
  })
  status: DiscoMonthlyReportStatus;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Types.ObjectId, ref: 'PortalUser', index: true })
  submittedBy?: Types.ObjectId;

  @Prop({ lowercase: true, trim: true, default: '' })
  submittedByEmail: string;
}

export const DiscoMonthlyReportSchema =
  SchemaFactory.createForClass(DiscoMonthlyReport);
