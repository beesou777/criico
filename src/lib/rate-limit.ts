import { createHash } from 'node:crypto';
import { HttpError } from './http';
const attempts = new Map<string, { count: number; expiresAt: number }>();
const windowMs = 15 * 60 * 1000;
// Per-process, email-keyed limit; multi-instance hosting needs an atomic shared store.
export function limitAuth(email: string, now = Date.now()): void {
  for (const [key, entry] of attempts)
    if (entry.expiresAt <= now) attempts.delete(key);
  const key = createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex');
  const entry = attempts.get(key);
  if (entry && entry.count >= 10)
    throw new HttpError(
      429,
      'Too many attempts for this email. Try again in 15 minutes.',
    );
  if (!entry && attempts.size >= 10000)
    throw new HttpError(
      429,
      'Too many authentication attempts. Please try again later.',
    );
  attempts.set(key, {
    count: (entry?.count ?? 0) + 1,
    expiresAt: entry?.expiresAt ?? now + windowMs,
  });
}
