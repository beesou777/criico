import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/session';
import { playerUpdateSchema } from '@/lib/validation';
import { getPlayerById, updatePlayer, deletePlayer, ServiceError } from '@/lib/services';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { message: 'Sign in to continue.' } }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: { message: 'Invalid player ID format.' } }, { status: 400 });
  }

  try {
    const player = await getPlayerById(user.id, id);
    if (!player) {
      return NextResponse.json({ error: { message: 'Player not found.' } }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error) {
    console.error('Get player error:', error);
    return NextResponse.json(
      { error: { message: 'Could not retrieve player.' } },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { message: 'Sign in to continue.' } }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: { message: 'Invalid player ID format.' } }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = playerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: parsed.error.issues[0]?.message ?? 'Invalid update data.' } },
        { status: 400 },
      );
    }

    const updated = await updatePlayer(user.id, id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    console.error('Update player error:', error);
    return NextResponse.json(
      { error: { message: 'Could not update player.' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { message: 'Sign in to continue.' } }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: { message: 'Invalid player ID format.' } }, { status: 400 });
  }

  try {
    await deletePlayer(user.id, id);
    return NextResponse.json({ success: true, message: 'Player deleted.' });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    console.error('Delete player error:', error);
    return NextResponse.json(
      { error: { message: 'Could not delete player.' } },
      { status: 500 },
    );
  }
}

