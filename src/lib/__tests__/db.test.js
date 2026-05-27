import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, _resetDb } from '../db';
import { runMigrations } from '../db/migrate';

describe('Turso DB', () => {
  beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = 'file::memory:';
    _resetDb();
    await runMigrations();
  });

  it('users 테이블이 존재한다', async () => {
    const db = getDb();
    const res = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`);
    expect(res.rows.length).toBe(1);
  });

  it('users 행 삽입과 조회', async () => {
    const db = getDb();
    const now = Date.now();
    await db.execute({
      sql: 'INSERT INTO users (id, device_id, language, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      args: ['u1', 'd1', 'vi', now, now],
    });
    const res = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: ['u1'] });
    expect(res.rows[0].device_id).toBe('d1');
    expect(res.rows[0].language).toBe('vi');
  });

  it('마이그레이션 멱등성', async () => {
    await runMigrations();
    const db = getDb();
    const res1 = await db.execute(`SELECT COUNT(*) as c FROM _migrations`);
    const count1 = Number(res1.rows[0].c);
    await runMigrations();
    const res2 = await db.execute(`SELECT COUNT(*) as c FROM _migrations`);
    const count2 = Number(res2.rows[0].c);
    expect(count2).toBe(count1); // 중복 실행해도 행 수 변화 없음
  });
});
