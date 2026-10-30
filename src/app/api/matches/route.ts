import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { getMatches, recordMatch } from '@/lib/services/matches';
import { matchListQuerySchema, urlQuery } from '@/lib/pagination';
import { apiError, readJSON, requireSameOrigin } from '@/lib/http';
import { matchSchema } from '@/lib/validation';
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const input = matchListQuerySchema.parse(
      urlQuery(request.nextUrl.searchParams),
    );
    return NextResponse.json(await getMatches(user.id, input));
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
    const input = matchSchema.parse(await readJSON(request));
    const result = await recordMatch(user.id, input);
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}
