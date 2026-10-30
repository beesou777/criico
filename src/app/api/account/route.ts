import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/session';
import { apiError, readJSON, requireSameOrigin } from '@/lib/http';
import { getAccount, updateAccount } from '@/lib/services/auth';
import { accountUpdateSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const account = await getAccount(user.id);
    if (!account)
      return NextResponse.json(
        { error: { message: 'Account not found.' } },
        { status: 404 },
      );
    return NextResponse.json(account);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json(
        { error: { message: 'Sign in to continue.' } },
        { status: 401 },
      );
    const input = accountUpdateSchema.parse(await readJSON(request));
    return NextResponse.json(await updateAccount(user.id, input));
  } catch (error) {
    return apiError(error);
  }
}
