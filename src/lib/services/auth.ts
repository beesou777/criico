import bcrypt from 'bcryptjs';
import { query } from '../db';
import { isUniqueViolation, ServiceError, type UserRecord } from './shared';

export async function createUser(
  email: string,
  password: string,
): Promise<UserRecord> {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const res = await query<UserRecord>(
      `INSERT INTO users (email, "passwordHash")
       VALUES ($1, $2)
       RETURNING id, email, "createdAt"`,
      [email.toLowerCase().trim(), passwordHash],
    );
    const user = res.rows[0];
    if (!user) {
      throw new ServiceError(500, 'User creation failed.');
    }
    return user;
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      throw new ServiceError(
        409,
        'An account with this email already exists. Sign in instead.',
      );
    }
    throw err;
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<UserRecord> {
  const normalizedEmail = email.toLowerCase().trim();
  const res = await query<{
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }>(
    `SELECT id, email, "passwordHash", "createdAt" FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  const user = res.rows[0];
  // Fallback hash to mitigate timing attacks against non-existent accounts
  const dummyHash =
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxD/6K0aIKM.IQOqFQKsL0Svba.';
  const valid = await bcrypt.compare(
    password,
    user ? user.passwordHash : dummyHash,
  );

  if (!user || !valid) {
    throw new ServiceError(401, 'Email or password is incorrect.');
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
