import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PortalSessionDocument = HydratedDocument<PortalSession>;

@Schema({ timestamps: true, collection: 'portal_sessions' })
export class PortalSession {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ type: Types.ObjectId, ref: 'PortalUser', required: true, index: true })
  userId: Types.ObjectId;

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

export const PortalSessionSchema = SchemaFactory.createForClass(PortalSession);
PortalSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
