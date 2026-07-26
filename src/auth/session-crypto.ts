import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createDeviceBinding(): string {
  return randomBytes(32).toString('base64url');
}

export function createSessionId(): string {
  return randomBytes(24).toString('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function normalizeUserAgent(ua: string | undefined): string {
  return (ua || '').trim().slice(0, 512);
}
