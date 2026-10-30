'use server';

import { redirect } from 'next/navigation';
import { createUser } from '@/lib/services/auth';
import { ServiceError } from '@/lib/services/shared';
import { credentialsSchema } from '@/lib/validation';
import { limitAuth } from '@/lib/rate-limit';
import { HttpError } from '@/lib/http';

export type RegistrationState = { error: string | null };

export async function registerAction(
  _previous: RegistrationState,
  form: FormData,
): Promise<RegistrationState> {
  const input = credentialsSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  });

  if (!input.success) {
    return { error: input.error.issues[0]?.message ?? 'Check your details.' };
  }

  if (form.get('confirmPassword') !== input.data.password) {
    return { error: 'Your passwords do not match.' };
  }

  try {
    limitAuth(input.data.email);
    await createUser(input.data.email, input.data.password);
  } catch (error) {
    return {
      error:
        error instanceof ServiceError || error instanceof HttpError
          ? error.message
          : 'Registration failed. Please try again.',
    };
  }

  redirect('/login?registered=1');
}
