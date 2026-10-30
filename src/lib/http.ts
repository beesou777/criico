import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function requireSameOrigin(request: NextRequest): void {
  const origin = request.headers.get('origin');
  if (
    !origin &&
    request.headers.get('authorization')?.startsWith('Bearer ') &&
    !request.cookies.get('criico_session')
  )
    return;
  const expected = process.env.APP_ORIGIN
    ? new URL(process.env.APP_ORIGIN).origin
    : request.nextUrl.origin;
  if (origin !== expected)
    throw new HttpError(403, 'Request origin is not allowed.');
}

export async function readJSON(request: NextRequest): Promise<unknown> {
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    throw new HttpError(415, 'Send JSON with Content-Type: application/json.');
  if (Number(request.headers.get('content-length') ?? 0) > 65536)
    throw new HttpError(413, 'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Send a JSON body.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 65536) {
        await reader.cancel();
        throw new HttpError(413, 'Request is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'Send valid JSON.');
  }
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof z.ZodError)
    return NextResponse.json(
      { error: { message: error.issues[0]?.message ?? 'Invalid input.' } },
      { status: 400 },
    );
  if (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number'
  )
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status },
    );
  console.error(
    'API request failed:',
    error instanceof Error ? error.name : 'UnknownError',
  );
  return NextResponse.json(
    { error: { message: 'Something went wrong. Please try again.' } },
    { status: 500 },
  );
}
