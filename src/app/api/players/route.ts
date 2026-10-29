import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { playerSchema } from '@/lib/validation';
import { getPlayers, createPlayer, ServiceError } from '@/lib/services';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { message: 'Sign in to continue.' } }, { status: 401 });
  }

  try {
    const players = await getPlayers(user.id);
    return NextResponse.json(players);
  } catch (error) {
    console.error('Fetch players error:', error);
    return NextResponse.json(
      { error: { message: 'Could not fetch players.' } },
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
    const parsed = playerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: parsed.error.issues[0]?.message ?? 'Invalid player input.' } },
        { status: 400 },
      );
    }

    const player = await createPlayer(user.id, parsed.data);
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    console.error('Create player error:', error);
    return NextResponse.json(
      { error: { message: 'Could not create player.' } },
      { status: 500 },
    );
  }
}
