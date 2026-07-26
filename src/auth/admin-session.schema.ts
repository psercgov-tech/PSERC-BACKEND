import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminSessionDocument = HydratedDocument<AdminSession>;

@Schema({ timestamps: true, collection: 'admin_sessions' })
export class AdminSession {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true, index: true })
  adminId: Types.ObjectId;

  @Prop({ required: true })
  deviceBindingHash: string;

  @Prop({ required: true, index: true })
  fingerprintHash: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  revokedAt?: Date;

  @Prop()
  lastSeenAt?: Date;
}

export const AdminSessionSchema = SchemaFactory.createForClass(AdminSession);
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
