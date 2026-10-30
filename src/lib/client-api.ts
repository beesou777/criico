import { errorMessage } from './contracts';
export async function submitJSON(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  input?: unknown,
) {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: input !== undefined ? JSON.stringify(input) : undefined,
    });
  } catch {
    throw new Error('Connection lost. Check your network and try again.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/auth/login') {
      window.location.assign('/login');
    }
    throw new Error(errorMessage(body));
  }
  return body;
}
