import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

@Schema({ timestamps: true, collection: 'chat_sessions' })
export class ChatSession {
  @Prop({ required: true, unique: true, index: true })
  sessionKey: string;

  @Prop()
  visitorName?: string;

  @Prop()
  visitorEmail?: string;

  @Prop({ default: false })
  newsletter: boolean;

  @Prop({ default: false })
  introduced: boolean;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
