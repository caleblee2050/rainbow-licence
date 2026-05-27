import { createClient } from '@libsql/client';

let _client = null;

export function getDb() {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL not set');
  _client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return _client;
}

// Dev/test 리셋용
export function _resetDb() {
  _client = null;
}
