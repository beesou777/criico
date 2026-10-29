import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { getLeaderboard } from '@/lib/services';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { message: 'Sign in to continue.' } }, { status: 401 });
  }

  try {
    const rankedPlayers = await getLeaderboard(user.id);
    return NextResponse.json(rankedPlayers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: { message: 'Could not calculate leaderboard.' } },
      { status: 500 },
    );
  }
}

