import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PortalUserDocument = HydratedDocument<PortalUser>;

@Schema({ timestamps: true, collection: 'portal_users' })
export class PortalUser {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ default: true })
  isActive: boolean;

  /** 6-digit password reset code sent by email. */
  @Prop({ trim: true })
  passwordResetToken?: string;

  /** Legacy link-based reset (uid + reset query params). */
  @Prop({ trim: true })
  resetUrlToken?: string;

  @Prop()
  passwordResetExpires?: Date;
}

export const PortalUserSchema = SchemaFactory.createForClass(PortalUser);
