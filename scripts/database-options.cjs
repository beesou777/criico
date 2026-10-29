// Shared by application, migrations, and optional seeding. Production verifies certificates.
function databaseOptions(connectionString) {
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL is not a valid connection URL.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const disabled =
    process.env.DATABASE_SSL === 'false' ||
    url.searchParams.get('sslmode') === 'disable';
  if (disabled && !local)
    throw new Error('TLS cannot be disabled for a remote database.');
  const skipVerification = process.env.DATABASE_SSL_VERIFY === 'false';
  if (skipVerification && process.env.NODE_ENV === 'production')
    throw new Error(
      'Database certificate verification is required in production.',
    );
  for (const option of [
    'sslmode',
    'ssl',
    'sslcert',
    'sslkey',
    'sslrootcert',
    'uselibpqcompat',
  ])
    url.searchParams.delete(option);
  const ca = process.env.DATABASE_CA_CERT
    ? process.env.DATABASE_CA_CERT.split(String.fromCharCode(92) + 'n').join(
        String.fromCharCode(10),
      )
    : process.env.DATABASE_CA_CERT_FILE
      ? require('node:fs').readFileSync(
          process.env.DATABASE_CA_CERT_FILE,
          'utf8',
        )
      : undefined;
  return {
    connectionString: url.toString(),
    ssl: disabled
      ? false
      : { rejectUnauthorized: !skipVerification, ...(ca ? { ca } : {}) },
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  };
}
module.exports = { databaseOptions };
