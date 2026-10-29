// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { databaseOptions } from '../scripts/database-options.cjs';
afterEach(() => vi.unstubAllEnvs());
describe('Database TLS configuration', () => {
  it('verifies remote certificates by default and does not let URL flags override it', () => {
    vi.stubEnv('DATABASE_SSL', 'true');
    vi.stubEnv('DATABASE_SSL_VERIFY', 'true');
    const options = databaseOptions(
      'postgresql://user:password@database.example/test?sslmode=no-verify',
    );
    expect(options.ssl).toMatchObject({ rejectUnauthorized: true });
    expect(options.connectionString).not.toContain('sslmode');
  });
  it('allows the requested development exception but refuses it in production', () => {
    vi.stubEnv('DATABASE_SSL_VERIFY', 'false');
    vi.stubEnv('NODE_ENV', 'development');
    expect(
      databaseOptions('postgresql://user:password@database.example/test').ssl,
    ).toMatchObject({ rejectUnauthorized: false });
    vi.stubEnv('NODE_ENV', 'production');
    expect(() =>
      databaseOptions('postgresql://user:password@database.example/test'),
    ).toThrow('production');
  });
});
