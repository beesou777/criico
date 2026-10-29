import { NextResponse, type NextRequest } from 'next/server';
import { credentialsSchema } from '@/lib/validation';
import {
  signSession,
  SESSION_COOKIE,
  getSessionCookieOptions,
} from '@/lib/session';
import { apiError, readJSON, requireSameOrigin } from '@/lib/http';
import { limitAuth } from '@/lib/rate-limit';
import { authenticateUser } from '@/lib/services';
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const input = credentialsSchema.parse(await readJSON(request));
    limitAuth(input.email);
    const user = await authenticateUser(input.email, input.password);
    const token = await signSession(user);
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 200 },
    );
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return apiError(error);
  }
}
