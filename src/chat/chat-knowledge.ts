import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type Chunk = {
  id: string;
  source: string;
  title: string;
  text: string;
  boost?: number;
};

const STOP = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'in',
  'for',
  'on',
  'is',
  'are',
  'was',
  'were',
  'be',
  'by',
  'as',
  'at',
  'it',
  'its',
  'this',
  'that',
  'with',
  'from',
  'what',
  'when',
  'where',
  'who',
  'how',
  'does',
  'do',
  'can',
  'could',
  'would',
  'should',
  'about',
  'please',
  'tell',
  'me',
  'any',
  'have',
  'has',
  'will',
  'under',
]);

function resolveKnowledgeDir(): string {
  const candidates = [
    join(__dirname, 'knowledge'),
    join(process.cwd(), 'dist', 'chat', 'knowledge'),
    join(process.cwd(), 'src', 'chat', 'knowledge'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'law-knowledge.json'))) return dir;
  }
  throw new Error(
    `Chat knowledge files not found. Looked in: ${candidates.join(', ')}`,
  );
}

let cached: Chunk[] | null = null;

function loadChunks(): Chunk[] {
  if (cached) return cached;
  const dir = resolveKnowledgeDir();
  const law = JSON.parse(
    readFileSync(join(dir, 'law-knowledge.json'), 'utf8'),
  ) as { chunks: { id: string; title: string; text: string }[] };
  const site = JSON.parse(
    readFileSync(join(dir, 'site-knowledge.json'), 'utf8'),
  ) as { chunks: Chunk[] };

  const lawChunks: Chunk[] = law.chunks.map((c) => ({
    id: c.id,
    source: 'Plateau State Electricity Law, 2024',
    title: c.title,
    text: c.text,
  }));

  cached = [...site.chunks, ...lawChunks];
  return cached;
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s\-']/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function scoreChunk(tokens: string[], chunk: Chunk): number {
  if (!tokens.length) return 0;
  const hay = `${chunk.source} ${chunk.title} ${chunk.text}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (!hay.includes(token)) continue;
    const titleHit = chunk.title.toLowerCase().includes(token);
    const sourceHit = chunk.source.toLowerCase().includes(token);
    const count = hay.split(token).length - 1;
    score += (titleHit ? 4.5 : sourceHit ? 2 : 1) + Math.min(count, 4) * 0.35;
  }
  return score * (chunk.boost ?? 1);
}

function pickExcerpt(text: string, tokens: string[], maxLen = 520): string {
  const lower = text.toLowerCase();
  let bestIdx = 0;
  let bestPos = -1;
  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx >= 0 && (bestPos < 0 || idx < bestPos)) {
      bestPos = idx;
      bestIdx = Math.max(0, idx - 80);
    }
  }
  let excerpt = text.slice(bestIdx, bestIdx + maxLen).trim();
  if (bestIdx > 0) excerpt = `…${excerpt}`;
  if (bestIdx + maxLen < text.length) excerpt = `${excerpt}…`;
  return excerpt;
}

export function answerFromKnowledge(
  question: string,
  recentContext: string[] = [],
): string {
  const chunks = loadChunks();
  const q = question.trim();
  if (!q) {
    return 'Please ask a question about PSERC, our leadership, news, published regulations, or the Plateau State Electricity Law, 2024.';
  }

  const contextTokens = recentContext
    .flatMap((line) => tokenize(line))
    .slice(-24);
  const qTokens = tokenize(q);
  const tokens = [
    ...qTokens,
    ...contextTokens.filter((t) => !qTokens.includes(t)).slice(0, 8),
  ];

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(tokens.length ? tokens : qTokens, chunk),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!ranked.length || ranked[0].score < 1.4) {
    return [
      'I could not find a clear answer in my current sources.',
      'You can ask about: who PSERC is, our mandate, leadership (Pioneers), how to contact us, licensing/consumers, published regulations under Resources → Documents, the Electricity Act 2023, or the Plateau State Electricity Law, 2024.',
      'You can also view previous messages in this chat — I remember this conversation on our servers.',
    ].join(' ');
  }

  const top = ranked[0];
  const excerpt = pickExcerpt(top.chunk.text, qTokens);
  const extras = ranked
    .slice(1)
    .filter((r) => r.score >= top.score * 0.4)
    .slice(0, 2);

  const lines = [
    `Based on ${top.chunk.source} (${top.chunk.title}):`,
    '',
    excerpt,
  ];

  if (extras.length) {
    lines.push('', 'Also relevant:');
    for (const item of extras) {
      lines.push(
        `• ${item.chunk.source} — ${item.chunk.title}: ${pickExcerpt(item.chunk.text, qTokens, 200)}`,
      );
    }
  }

  lines.push(
    '',
    'Guidance only. For the official text, read PSERC regulations under Resources → Documents on this website. Sign in only if you need to download a PDF.',
  );

  return lines.join('\n');
}
