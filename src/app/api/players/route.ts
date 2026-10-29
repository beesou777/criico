import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { createPlayer, getPlayers } from '@/lib/services/players';
import { playerListQuerySchema, urlQuery } from '@/lib/pagination';
import { apiError, readJSON, requireSameOrigin } from '@/lib/http';
import { playerSchema } from '@/lib/validation';
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const input = playerListQuerySchema.parse(
      urlQuery(request.nextUrl.searchParams),
    );
    return NextResponse.json(await getPlayers(user.id, input));
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const input = playerSchema.parse(await readJSON(request));
    const result = await createPlayer(user.id, input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
