import { randomBytes, createHash } from 'crypto';

export function generatePlaintextApiKey(): string {
  return `rs_live_${randomBytes(24).toString('hex')}`;
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
