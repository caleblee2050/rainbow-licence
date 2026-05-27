import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { getDb } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_MIGRATIONS_DIR = resolve(__dirname, '../../../migrations');

export async function runMigrations(dir = DEFAULT_MIGRATIONS_DIR) {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);
  const files = (await readdir(dir)).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const id = f.replace('.sql', '');
    const exists = await db.execute({
      sql: 'SELECT id FROM _migrations WHERE id = ?',
      args: [id],
    });
    if (exists.rows.length > 0) continue;
    const sql = await readFile(join(dir, f), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    await db.batch([
      ...statements,
      { sql: 'INSERT INTO _migrations (id, applied_at) VALUES (?, ?)', args: [id, Date.now()] },
    ], 'write');
    console.log(`✓ migration ${id} applied`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
