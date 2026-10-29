import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, getSessionCookieOptions } from '@/lib/session';
import { apiError, requireSameOrigin } from '@/lib/http';
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, '', {
      ...getSessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
