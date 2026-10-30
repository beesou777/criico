import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { apiError, readJSON, requireSameOrigin } from '@/lib/http';
import { setTeamDisbanded, updateTeamName } from '@/lib/services/teams';
import { z } from 'zod';

const teamInput = z.object({ name: z.string().trim().min(2).max(80) }).strict();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    await setTeamDisbanded(user.id, (await params).id, true);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const input = teamInput.parse(await readJSON(request));
    await updateTeamName(user.id, (await params).id, input.name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    await setTeamDisbanded(user.id, (await params).id, false);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
