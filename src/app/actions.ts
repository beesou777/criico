'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createUser, ServiceError } from '@/lib/services';

export type RegistrationState = { error: string | null };

export async function registerAction(
  _previous: RegistrationState,
  form: FormData,
): Promise<RegistrationState> {
  const input = z
    .object({
      email: z.string().email('Enter a valid email address.').max(254),
      password: z
        .string()
        .min(10, 'Use at least 10 characters.')
        .max(72, 'Use at most 72 characters.'),
    })
    .safeParse({
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
    await createUser(input.data.email, input.data.password);
  } catch (error) {
    return {
      error:
        error instanceof ServiceError
          ? error.message
          : 'Registration failed. Please try again.',
    };
  }

  redirect('/login?registered=1');
}
