import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatMessage,
  ChatMessageSchema,
} from '../chat/chat-message.schema';
import {
  ChatSession,
  ChatSessionSchema,
} from '../chat/chat-session.schema';
import { Contact, ContactSchema } from '../contacts/contact.schema';
import { MediaAsset, MediaSchema } from '../media/media.schema';
import { News, NewsSchema } from '../news/news.schema';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: News.name, schema: NewsSchema },
      { name: MediaAsset.name, schema: MediaSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
