import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  /** Lowercase initials used to build {initials}@pserc.plateau.gov.ng */
  @Prop({ trim: true, lowercase: true, default: '' })
  initials: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
