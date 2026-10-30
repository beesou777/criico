import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { apiError, readJSON, requireSameOrigin } from '@/lib/http';
import { createTeam, getTeams } from '@/lib/services/teams';
import { z } from 'zod';

const teamInput = z.object({ name: z.string().trim().min(2).max(80) }).strict();

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    return NextResponse.json({ data: await getTeams(user.id) });
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
    return NextResponse.json(
      await createTeam(user.id, teamInput.parse(await readJSON(request)).name),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
