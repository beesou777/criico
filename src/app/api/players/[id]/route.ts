import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/session';
import { playerUpdateSchema } from '@/lib/validation';
import {
  deletePlayer,
  getPlayerById,
  updatePlayer,
} from '@/lib/services/players';
import { apiError, readJSON, requireSameOrigin } from '@/lib/http';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const id = z.uuid().parse((await context.params).id);
    const player = await getPlayerById(user.id, id);
    return player
      ? NextResponse.json(player)
      : NextResponse.json(
          { error: { message: 'Player not found.' } },
          { status: 404 },
        );
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: NextRequest, context: Context) {
  try {
    requireSameOrigin(request);
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const id = z.uuid().parse((await context.params).id);
    const input = playerUpdateSchema.parse(await readJSON(request));
    return NextResponse.json(await updatePlayer(user.id, id, input));
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: NextRequest, context: Context) {
  try {
    requireSameOrigin(request);
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const id = z.uuid().parse((await context.params).id);
    await deletePlayer(user.id, id);
    return NextResponse.json({ success: true, message: 'Player deleted.' });
  } catch (error) {
    return apiError(error);
  }
}
