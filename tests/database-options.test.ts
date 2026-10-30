// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { databaseOptions } from '../scripts/database-options.cjs';
afterEach(() => vi.unstubAllEnvs());
describe('Database TLS configuration', () => {
  it('keeps encrypted connections compatible with the hosted assignment database', () => {
    vi.stubEnv('DATABASE_SSL', 'true');
    const options = databaseOptions(
      'postgresql://user:password@database.example/test?sslmode=no-verify',
    );
    expect(options.ssl).toMatchObject({ rejectUnauthorized: false });
    expect(options.connectionString).not.toContain('sslmode');
  });
  it('does not allow URL flags to disable encrypted transport for remote databases', () => {
    expect(() =>
      databaseOptions(
        'postgresql://user:password@database.example/test?sslmode=disable',
      ),
    ).toThrow('TLS cannot be disabled');
  });
});
