import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { answerFromKnowledge } from './chat-knowledge';
import { ChatMessage, ChatMessageDocument } from './chat-message.schema';
import { ChatSession, ChatSessionDocument } from './chat-session.schema';
import { AskDto, IntroduceDto } from './dto/chat.dto';

const WELCOME =
  'Hi there — I’m the PSERC assistant. Ask me about the Commission, leadership, licensing, consumers, or the Plateau State Electricity Law, 2024. I remember this conversation so you can revisit previous questions anytime.';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSession.name)
    private readonly sessions: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messages: Model<ChatMessageDocument>,
  ) {}

  async createSession(sessionKey?: string) {
    const key = sessionKey?.trim() || randomUUID();
    let session = await this.sessions.findOne({ sessionKey: key });
    if (!session) {
      // Draft session only — visitor identity is saved on introduce.
      session = await this.sessions.create({
        sessionKey: key,
        newsletter: false,
        introduced: false,
      });
    }
    const history = session.introduced ? await this.getHistory(key) : [];
    return {
      sessionKey: key,
      introduced: session.introduced,
      visitorName: session.visitorName,
      visitorEmail: session.visitorEmail,
      messages: history,
    };
  }

  async introduce(dto: IntroduceDto) {
    const key = dto.sessionKey?.trim();
    if (!key) throw new BadRequestException('sessionKey is required');

    const email = dto.email.trim().toLowerCase();
    let session = await this.sessions.findOne({ sessionKey: key });
    if (!session) {
      session = await this.sessions.create({
        sessionKey: key,
        newsletter: false,
        introduced: false,
      });
    }

    session.visitorName = dto.name?.trim() || session.visitorName || '';
    session.visitorEmail = email;
    session.newsletter = Boolean(dto.newsletter);
    session.introduced = true;
    await session.save();

    const existingCount = await this.messages.countDocuments({
      sessionKey: session.sessionKey,
    });
    if (existingCount === 0) {
      await this.messages.create({
        sessionId: session._id,
        sessionKey: session.sessionKey,
        role: 'assistant',
        text: WELCOME,
      });
    }

    const greetName = session.visitorName ? `, ${session.visitorName}` : '';
    const reply = `Thanks${greetName}! You’re all set. Ask me anything about PSERC or the Plateau State Electricity Law — I’ll keep our previous questions in this chat.`;

    await this.messages.create({
      sessionId: session._id,
      sessionKey: session.sessionKey,
      role: 'assistant',
      text: reply,
    });

    return {
      sessionKey: session.sessionKey,
      introduced: true,
      visitorName: session.visitorName,
      visitorEmail: session.visitorEmail,
      messages: await this.getHistory(session.sessionKey),
    };
  }

  async getHistory(sessionKey: string, limit = 100) {
    const rows = await this.messages
      .find({ sessionKey })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return rows.map((m) => ({
      id: String(m._id),
      role: m.role as 'user' | 'assistant' | 'system',
      text: m.text,
      createdAt: (m as { createdAt?: Date }).createdAt,
    }));
  }

  async ask(dto: AskDto) {
    const session = await this.sessions.findOne({ sessionKey: dto.sessionKey });
    if (!session) throw new NotFoundException('Chat session not found');
    if (!session.introduced || !session.visitorEmail) {
      throw new BadRequestException(
        'Please introduce yourself with your email before chatting.',
      );
    }

    const text = dto.message.trim();
    await this.messages.create({
      sessionId: session._id,
      sessionKey: session.sessionKey,
      role: 'user',
      text,
    });

    const recent = await this.messages
      .find({ sessionKey: session.sessionKey, role: 'user' })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    const context = recent.map((m) => m.text).reverse();

    const reply = answerFromKnowledge(text, context);
    const assistant = await this.messages.create({
      sessionId: session._id,
      sessionKey: session.sessionKey,
      role: 'assistant',
      text: reply,
    });

    // Bump updatedAt so admin list sorts by recent activity.
    session.markModified('visitorEmail');
    await session.save();

    return {
      sessionKey: session.sessionKey,
      userMessage: { id: 'pending', role: 'user' as const, text },
      assistantMessage: {
        id: String(assistant._id),
        role: 'assistant' as const,
        text: reply,
      },
      messages: await this.getHistory(session.sessionKey),
    };
  }

  async listSessions() {
    // Only visitors who completed chatbot intro (email saved).
    const rows = await this.sessions
      .find({
        introduced: true,
        visitorEmail: { $exists: true, $nin: [null, ''] },
      })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    const enriched = await Promise.all(
      rows.map(async (session) => {
        const messageCount = await this.messages.countDocuments({
          sessionKey: session.sessionKey,
        });
        const last = await this.messages
          .findOne({ sessionKey: session.sessionKey })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: String(session._id),
          sessionKey: session.sessionKey,
          visitorName: session.visitorName || '',
          visitorEmail: session.visitorEmail || '',
          newsletter: Boolean(session.newsletter),
          introduced: Boolean(session.introduced),
          messageCount,
          lastMessage: last?.text || '',
          lastMessageAt:
            (last as { createdAt?: Date } | null)?.createdAt ||
            (session as { updatedAt?: Date }).updatedAt,
          createdAt: (session as { createdAt?: Date }).createdAt,
          updatedAt: (session as { updatedAt?: Date }).updatedAt,
        };
      }),
    );

    return enriched.sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime(),
    );
  }

  async getSessionForAdmin(sessionKey: string) {
    const key = sessionKey?.trim();
    if (!key) throw new NotFoundException('Chat session not found');

    const session = await this.sessions.findOne({ sessionKey: key }).lean();
    if (!session) throw new NotFoundException('Chat session not found');

    const messages = await this.messages
      .find({ sessionKey: key })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return {
      id: String(session._id),
      sessionKey: session.sessionKey,
      visitorName: session.visitorName || '',
      visitorEmail: session.visitorEmail || '',
      newsletter: Boolean(session.newsletter),
      introduced: Boolean(session.introduced),
      createdAt: (session as { createdAt?: Date }).createdAt,
      updatedAt: (session as { updatedAt?: Date }).updatedAt,
      messages: messages.map((m) => ({
        id: String(m._id),
        role: m.role as 'user' | 'assistant' | 'system',
        text: m.text,
        createdAt: (m as { createdAt?: Date }).createdAt,
      })),
    };
  }
}
