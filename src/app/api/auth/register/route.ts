import { NextResponse, type NextRequest } from 'next/server';
import { credentialsSchema } from '@/lib/validation';
import { createUser, ServiceError } from '@/lib/services';
import { signSession, SESSION_COOKIE, getSessionCookieOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: parsed.error.issues[0]?.message ?? 'Invalid registration input.' } },
        { status: 400 },
      );
    }

    const user = await createUser(parsed.data.email, parsed.data.password);
    const token = await signSession(user);

    const response = NextResponse.json(
      {
        token,
        user: { id: user.id, email: user.email },
      },
      { status: 201 },
    );

    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());

    return response;
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: error.status },
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: { message: 'Registration failed. Please try again.' } },
      { status: 500 },
    );
  }
}

