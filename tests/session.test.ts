// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from '../src/lib/session';
import { middleware } from '../src/middleware';

const secret = 'test-only-secret-with-more-than-32-characters';

async function sign(
  options: { audience?: string; expiry?: string; algorithm?: string } = {},
) {
  return new SignJWT({ email: 'organizer@example.com' })
    .setProtectedHeader({ alg: options.algorithm ?? 'HS256' })
    .setSubject('405be0dc-9ae6-43d9-b612-d52f1b538709')
    .setIssuer('criico-api')
    .setAudience(options.audience ?? 'criico-web')
    .setIssuedAt()
    .setExpirationTime(options.expiry ?? '1h')
    .sign(new TextEncoder().encode(secret));
}

afterEach(() => vi.unstubAllEnvs());

describe('Dashboard JWT verification', () => {
  it('accepts a valid session and rejects missing, forged, expired, and wrong-audience tokens', async () => {
    vi.stubEnv('JWT_SECRET', secret);
    expect(await verifySession(await sign())).toEqual({
      id: '405be0dc-9ae6-43d9-b612-d52f1b538709',
      email: 'organizer@example.com',
    });
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession('forged.jwt.token')).toBeNull();
    expect(await verifySession(await sign({ expiry: '-1h' }))).toBeNull();
    expect(
      await verifySession(await sign({ audience: 'another-app' })),
    ).toBeNull();
  });
});

describe('Route Protection Middleware', () => {
  it('redirects unauthenticated user accessing /dashboard to /login', async () => {
    vi.stubEnv('JWT_SECRET', secret);
    const req = new NextRequest('http://localhost:3100/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3100/login');
  });

  it('redirects already authenticated user accessing /login to /dashboard', async () => {
    vi.stubEnv('JWT_SECRET', secret);
    const token = await sign();
    const req = new NextRequest('http://localhost:3100/login', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3100/dashboard');
  });

  it('redirects already authenticated user accessing /register to /dashboard', async () => {
    vi.stubEnv('JWT_SECRET', secret);
    const token = await sign();
    const req = new NextRequest('http://localhost:3100/register', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3100/dashboard');
  });

  it('allows authenticated user accessing /dashboard to proceed', async () => {
    vi.stubEnv('JWT_SECRET', secret);
    const token = await sign();
    const req = new NextRequest('http://localhost:3100/dashboard', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});
