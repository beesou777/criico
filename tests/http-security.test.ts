// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requireSameOrigin, readJSON } from '../src/lib/http';
import { signSession, verifySession } from '../src/lib/session';
import { limitAuth } from '../src/lib/rate-limit';
afterEach(() => vi.unstubAllEnvs());
describe('Authentication and request boundaries', () => {
  it('fails closed with a missing or short signing key', async () => {
    vi.stubEnv('JWT_SECRET', '');
    await expect(
      signSession({ id: crypto.randomUUID(), email: 'test@example.com' }),
    ).rejects.toThrow('JWT_SECRET');
    expect(await verifySession('forged.jwt.token')).toBeNull();
    vi.stubEnv('JWT_SECRET', 'short');
    await expect(
      signSession({ id: crypto.randomUUID(), email: 'test@example.com' }),
    ).rejects.toThrow();
  });
  it('rejects foreign and missing origins for ambient-cookie requests', () => {
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3100');
    expect(() =>
      requireSameOrigin(
        new NextRequest('http://localhost:3100/api/players', {
          headers: { origin: 'https://foreign.example' },
        }),
      ),
    ).toThrow('origin');
    expect(() =>
      requireSameOrigin(new NextRequest('http://localhost:3100/api/players')),
    ).toThrow('origin');
    expect(() =>
      requireSameOrigin(
        new NextRequest('http://localhost:3100/api/players', {
          headers: { origin: 'http://localhost:3100' },
        }),
      ),
    ).not.toThrow();
  });
  it('limits repeated attempts for a normalized account and expires the window', () => {
    const email = 'rate-' + crypto.randomUUID() + '@example.com';
    for (let i = 0; i < 10; i++) limitAuth(email, 1000);
    expect(() => limitAuth(email.toUpperCase(), 1001)).toThrow(
      'Too many attempts',
    );
    expect(() => limitAuth(email, 1000 + 15 * 60 * 1000)).not.toThrow();
  });
  it('rejects invalid JSON, non-JSON bodies, and oversized requests', async () => {
    const req = (body: string, type = 'application/json') =>
      new NextRequest('http://localhost:3100/api/players', {
        method: 'POST',
        headers: { 'content-type': type },
        body,
      });
    await expect(readJSON(req('{'))).rejects.toThrow('valid JSON');
    await expect(readJSON(req('{}', 'text/plain'))).rejects.toThrow(
      'Content-Type',
    );
    await expect(readJSON(req('x'.repeat(65537)))).rejects.toThrow('too large');
  });
});
