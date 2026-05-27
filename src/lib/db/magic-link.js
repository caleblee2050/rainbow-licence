import { randomUUID } from 'node:crypto';
import { getDb } from '../db';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min

export async function createToken(email, userId = null) {
    const db = getDb();
    const token = randomUUID().replace(/-/g, '');
    const now = Date.now();
    await db.execute({
        sql: `INSERT INTO magic_link_tokens (token, email, user_id, expires_at, used, created_at)
              VALUES (?, ?, ?, ?, 0, ?)`,
        args: [token, email, userId, now + TOKEN_TTL_MS, now],
    });
    return token;
}

export async function consumeToken(token) {
    const db = getDb();
    const res = await db.execute({
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ? AND used = 0 AND expires_at > ?',
        args: [token, Date.now()],
    });
    const row = res.rows[0];
    if (!row) return null;
    await db.execute({
        sql: 'UPDATE magic_link_tokens SET used = 1 WHERE token = ?',
        args: [token],
    });
    return { email: row.email, userId: row.user_id };
}
