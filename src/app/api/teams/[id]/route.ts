import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { apiError, requireSameOrigin } from '@/lib/http';
import { deleteTeam, setTeamDisbanded } from '@/lib/services/teams';

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
    await deleteTeam(user.id, (await params).id);
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
