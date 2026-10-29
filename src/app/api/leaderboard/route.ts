import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { getLeaderboard } from '@/lib/services';
import { playerListQuerySchema, urlQuery } from '@/lib/pagination';
import { apiError } from '@/lib/http';

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
    return NextResponse.json(await getLeaderboard(user.id, input));
  } catch (error) {
    return apiError(error);
  }
}
