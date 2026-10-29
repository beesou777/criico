import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { matchSchema } from '@/lib/validation';
import { getMatches, recordMatch, ServiceError } from '@/lib/services';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { message: 'Sign in to continue.' } }, { status: 401 });
  }

  try {
    const matches = await getMatches(user.id);
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Fetch matches error:', error);
    return NextResponse.json(
      { error: { message: 'Could not fetch matches.' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { message: 'Sign in to continue.' } }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = matchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: parsed.error.issues[0]?.message ?? 'Invalid match data.' } },
        { status: 400 },
      );
    }

    const result = await recordMatch(user.id, parsed.data);
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    console.error('Record match error:', error);
    return NextResponse.json(
      { error: { message: 'Could not record match.' } },
      { status: 500 },
    );
  }
}

