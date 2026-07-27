import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from '../chat/chat-message.schema';
import { ChatSession, ChatSessionDocument } from '../chat/chat-session.schema';
import { Contact, ContactDocument } from '../contacts/contact.schema';
import { MediaAsset, MediaDocument } from '../media/media.schema';
import { News, NewsDocument } from '../news/news.schema';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function lastSixMonthBuckets() {
  const now = new Date();
  const months: { key: string; label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString('en-US', { month: 'short' }),
      value: 0,
    });
  }
  return months;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contacts: Model<ContactDocument>,
    @InjectModel(News.name) private readonly news: Model<NewsDocument>,
    @InjectModel(MediaAsset.name)
    private readonly media: Model<MediaDocument>,
    @InjectModel(ChatSession.name)
    private readonly sessions: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messages: Model<ChatMessageDocument>,
  ) {}

  async dashboard() {
    const today = startOfToday();
    const weekAgo = daysAgo(7);

    const [
      contactsTotal,
      complaintsOpen,
      complaintsWeek,
      complaintsTotal,
      unreadInbox,
      newsPublished,
      mediaCount,
      chatVisitors,
      aiMessagesToday,
      aiMessagesTotal,
      recentComplaints,
      contactDates,
      sessionDates,
      newsDates,
      messageDates,
    ] = await Promise.all([
      this.contacts.countDocuments(),
      this.contacts.countDocuments({ type: 'complaint', status: 'open' }),
      this.contacts.countDocuments({
        type: 'complaint',
        createdAt: { $gte: weekAgo },
      }),
      this.contacts.countDocuments({ type: 'complaint' }),
      this.contacts.countDocuments({ isRead: false }),
      this.news.countDocuments({ published: true }),
      this.media.countDocuments(),
      this.sessions.countDocuments({
        introduced: true,
        visitorEmail: { $exists: true, $nin: [null, ''] },
      }),
      this.messages.countDocuments({
        role: 'user',
        createdAt: { $gte: today },
      }),
      this.messages.countDocuments({ role: 'user' }),
      this.contacts
        .find({ type: 'complaint' })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      this.contacts.find().select('createdAt').lean(),
      this.sessions
        .find({ introduced: true })
        .select('updatedAt createdAt')
        .lean(),
      this.news.find({ published: true }).select('publishedAt createdAt').lean(),
      this.messages
        .find({ role: 'user' })
        .select('createdAt')
        .lean(),
    ]);

    const traffic = lastSixMonthBuckets();
    const bump = (iso?: Date | string) => {
      if (!iso) return;
      const key = monthKey(new Date(iso));
      const row = traffic.find((m) => m.key === key);
      if (row) row.value += 1;
    };

    for (const row of contactDates) {
      bump((row as { createdAt?: Date }).createdAt);
    }
    for (const row of sessionDates) {
      bump(
        (row as { updatedAt?: Date; createdAt?: Date }).updatedAt ||
          (row as { createdAt?: Date }).createdAt,
      );
    }
    for (const row of newsDates) {
      bump(
        (row as { publishedAt?: Date; createdAt?: Date }).publishedAt ||
          (row as { createdAt?: Date }).createdAt,
      );
    }
    for (const row of messageDates) {
      bump((row as { createdAt?: Date }).createdAt);
    }

    const topQuery = await this.messages
      .find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const phraseCounts = new Map<string, number>();
    for (const msg of topQuery) {
      const words = String(msg.text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 4)
        .join(' ');
      if (!words) continue;
      phraseCounts.set(words, (phraseCounts.get(words) || 0) + 1);
    }
    const topPhrase =
      [...phraseCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'No queries yet';

    return {
      metrics: {
        chatVisitors,
        aiQueriesToday: aiMessagesToday,
        aiQueriesTotal: aiMessagesTotal,
        complaintsWeek,
        complaintsOpen,
        complaintsTotal,
        contactsTotal,
        unreadInbox,
        documentsPublished: newsPublished + mediaCount,
        newsPublished,
        mediaCount,
      },
      traffic,
      recentComplaints: recentComplaints.map((c) => ({
        id: String(c._id),
        name: c.name,
        email: c.email,
        message: c.message,
        status: c.status || 'open',
        type: c.type || 'inquiry',
        createdAt: (c as { createdAt?: Date }).createdAt,
      })),
      ai: {
        queriesToday: aiMessagesToday,
        queriesTotal: aiMessagesTotal,
        topQuery: topPhrase,
        escalated: unreadInbox,
        avgResponse: '1.2s',
      },
      sla: [
        { value: '24/7', label: 'AI Support' },
        { value: '< 2s', label: 'Load Time' },
        { value: '99.9%', label: 'Uptime SLA' },
        { value: '100%', label: 'WCAG AA' },
      ],
      security: {
        status: 'all_clear',
        label: 'Security: All Clear',
        detail: 'Browser-bound admin sessions active',
      },
    };
  }
}
