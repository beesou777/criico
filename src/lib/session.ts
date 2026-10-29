import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'criico_session';
const ISSUER = 'criico-api';
const AUDIENCE = 'criico-web';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'criico-super-secret-grassroots-jwt-key-32-chars';
  return new TextEncoder().encode(secret);
}

export async function signSession(user: { id: string; email: string }): Promise<string> {
  const key = getJwtSecret();
  return await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key);
}

export async function verifySession(token: string | undefined): Promise<{ id: string; email: string } | null> {
  if (!token) return null;
  try {
    const key = getJwtSecret();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
  };
}

/**
 * Server Component / Server Action session helper.
 * Uses dynamic import so that importing session.ts in middleware.ts does not pull next/headers into Edge runtime.
 */
export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    return await verifySession(token);
  } catch {
    return null;
  }
}

export async function getAuthUser(request: {
  headers: Headers;
  cookies: { get: (name: string) => { value: string } | undefined };
}): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = await verifySession(token);
    if (user) return user;
  }
  const cookieVal = request.cookies.get(SESSION_COOKIE)?.value;
  return await verifySession(cookieVal);
}
