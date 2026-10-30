import bcrypt from 'bcryptjs';
import { query } from '../db';
import { isUniqueViolation, ServiceError, type UserRecord } from './shared';

export async function createUser(
  email: string,
  password: string,
  organizationName = 'Grassroots Cricket Manager',
): Promise<UserRecord> {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const res = await query<UserRecord>(
      `INSERT INTO users (email, "passwordHash", "organizationName")
       VALUES ($1, $2, $3)
       RETURNING id, email, "organizationName", "createdAt"`,
      [email.toLowerCase().trim(), passwordHash, organizationName.trim()],
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
    organizationName: string;
    createdAt: Date;
  }>(
    `SELECT id, email, "passwordHash", "organizationName", "createdAt" FROM users WHERE email = $1`,
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
    organizationName: user.organizationName,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getAccount(ownerId: string): Promise<UserRecord | null> {
  const res = await query<{
    id: string;
    email: string;
    organizationName: string;
    createdAt: Date;
  }>(
    'SELECT id, email, "organizationName", "createdAt" FROM users WHERE id = $1',
    [ownerId],
  );
  const account = res.rows[0];
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    organizationName: account.organizationName,
    createdAt: account.createdAt.toISOString(),
  };
}

export async function updateAccount(
  ownerId: string,
  input: {
    organizationName?: string;
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<UserRecord> {
  const account = await query<{ email: string; passwordHash: string }>(
    'SELECT email, "passwordHash" FROM users WHERE id = $1',
    [ownerId],
  );
  const current = account.rows[0];
  if (!current) throw new ServiceError(404, 'Account not found.');

  if (input.newPassword) {
    const valid = await bcrypt.compare(
      input.currentPassword ?? '',
      current.passwordHash,
    );
    if (!valid) throw new ServiceError(400, 'Current password is incorrect.');
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await query('UPDATE users SET "passwordHash" = $1 WHERE id = $2', [
      passwordHash,
      ownerId,
    ]);
  }

  if (input.organizationName) {
    await query('UPDATE users SET "organizationName" = $1 WHERE id = $2', [
      input.organizationName.trim(),
      ownerId,
    ]);
  }

  const updated = await getAccount(ownerId);
  if (!updated) throw new ServiceError(500, 'Could not update account.');
  return updated;
}
