import { randomUUID } from 'node:crypto';
import { getDb } from '../db';

export async function getUserById(id) {
    const db = getDb();
    const res = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return res.rows[0] ?? null;
}

export async function getUserByDeviceId(deviceId) {
    const db = getDb();
    const res = await db.execute({ sql: 'SELECT * FROM users WHERE device_id = ?', args: [deviceId] });
    return res.rows[0] ?? null;
}

export async function getUserByEmail(email) {
    const db = getDb();
    const res = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    return res.rows[0] ?? null;
}

export async function createDeviceUser({ deviceId, schoolCode, language = 'vi', koreanLevel = null }) {
    const db = getDb();
    const id = randomUUID();
    const now = Date.now();
    await db.execute({
        sql: `INSERT INTO users (id, device_id, school_code, language, korean_level, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, deviceId, schoolCode ?? null, language, koreanLevel, now, now],
    });
    return getUserById(id);
}

export async function updateUser(id, patch) {
    const db = getDb();
    const allowed = ['email', 'display_name', 'language', 'korean_level', 'school_code'];
    const set = Object.keys(patch).filter(k => allowed.includes(k));
    if (set.length === 0) return getUserById(id);
    const setSql = set.map(k => `${k} = ?`).join(', ');
    const args = [...set.map(k => patch[k]), Date.now(), id];
    await db.execute({
        sql: `UPDATE users SET ${setSql}, updated_at = ? WHERE id = ?`,
        args,
    });
    return getUserById(id);
}
