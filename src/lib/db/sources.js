import { randomUUID } from 'node:crypto';
import { getDb } from '../db';

// --- sources ---
export async function createSource({ userId, licenceId, type, title, originalFilename = null, rawText = null }) {
    const db = getDb();
    const id = randomUUID();
    const now = Date.now();
    await db.execute({
        sql: `INSERT INTO sources (id, user_id, licence_id, type, title, original_filename, raw_text, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        args: [id, userId, licenceId, type, title, originalFilename, rawText, now, now],
    });
    return getSourceById(id);
}

export async function getSourceById(id) {
    const db = getDb();
    const res = await db.execute({ sql: 'SELECT * FROM sources WHERE id = ?', args: [id] });
    return res.rows[0] ?? null;
}

export async function listSourcesByUserAndLicence(userId, licenceId) {
    const db = getDb();
    const res = await db.execute({
        sql: 'SELECT * FROM sources WHERE user_id = ? AND licence_id = ? ORDER BY created_at DESC',
        args: [userId, licenceId],
    });
    return res.rows;
}

export async function updateSourceStatus(id, status, message = null) {
    const db = getDb();
    await db.execute({
        sql: `UPDATE sources SET status = ?, status_message = ?, updated_at = ? WHERE id = ?`,
        args: [status, message, Date.now(), id],
    });
}

export async function setSourceRawText(id, rawText) {
    const db = getDb();
    await db.execute({
        sql: `UPDATE sources SET raw_text = ?, updated_at = ? WHERE id = ?`,
        args: [rawText, Date.now(), id],
    });
}

export async function setSourceDomainScore(id, score) {
    const db = getDb();
    await db.execute({
        sql: `UPDATE sources SET domain_score = ?, updated_at = ? WHERE id = ?`,
        args: [score, Date.now(), id],
    });
}

export async function deleteSource(id) {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM sources WHERE id = ?', args: [id] });
}

// --- summaries ---
export async function upsertSummary(sourceId, langs) {
    const db = getDb();
    const id = randomUUID();
    const now = Date.now();
    await db.execute({
        sql: `INSERT INTO summaries (id, source_id, ko_text, vi_text, zh_text, th_text, tl_text, my_text, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(source_id) DO UPDATE SET
                ko_text = excluded.ko_text,
                vi_text = excluded.vi_text,
                zh_text = excluded.zh_text,
                th_text = excluded.th_text,
                tl_text = excluded.tl_text,
                my_text = excluded.my_text`,
        args: [id, sourceId, langs.ko ?? null, langs.vi ?? null, langs.zh ?? null, langs.th ?? null, langs.tl ?? null, langs.my ?? null, now],
    });
}

export async function getSummary(sourceId) {
    const db = getDb();
    const res = await db.execute({ sql: 'SELECT * FROM summaries WHERE source_id = ?', args: [sourceId] });
    return res.rows[0] ?? null;
}

// --- concepts ---
export async function insertConcepts(sourceId, conceptList) {
    const db = getDb();
    const now = Date.now();
    for (const c of conceptList) {
        await db.execute({
            sql: `INSERT INTO concepts (id, source_id, korean, korean_definition, pronunciation, category,
                                          vi, zh, th, tl, my, vi_def, zh_def, th_def, tl_def, my_def, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [randomUUID(), sourceId, c.korean, c.korean_definition, c.pronunciation ?? null, c.category ?? null,
                   c.vi ?? null, c.zh ?? null, c.th ?? null, c.tl ?? null, c.my ?? null,
                   c.vi_def ?? null, c.zh_def ?? null, c.th_def ?? null, c.tl_def ?? null, c.my_def ?? null, now],
        });
    }
}

export async function listConceptsBySource(sourceId) {
    const db = getDb();
    const res = await db.execute({ sql: 'SELECT * FROM concepts WHERE source_id = ? ORDER BY created_at', args: [sourceId] });
    return res.rows;
}

// --- problems ---
export async function insertProblems(sourceId, problemList) {
    const db = getDb();
    const now = Date.now();
    for (const p of problemList) {
        await db.execute({
            sql: `INSERT INTO problems (id, source_id, ko_question, ko_options_json, correct_answer, ko_explanation,
                                           ko_simple_explanation, translations_json, keyword_hints_json, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [randomUUID(), sourceId, p.ko_question, JSON.stringify(p.ko_options), p.correct_answer,
                   p.ko_explanation, p.ko_simple_explanation ?? null,
                   JSON.stringify(p.translations), JSON.stringify(p.keyword_hints), now],
        });
    }
}

export async function listProblemsBySource(sourceId) {
    const db = getDb();
    const res = await db.execute({ sql: 'SELECT * FROM problems WHERE source_id = ? ORDER BY created_at', args: [sourceId] });
    return res.rows.map(r => ({
        id: r.id,
        source_id: r.source_id,
        ko_question: r.ko_question,
        ko_options: JSON.parse(r.ko_options_json),
        correct_answer: Number(r.correct_answer),
        ko_explanation: r.ko_explanation,
        ko_simple_explanation: r.ko_simple_explanation,
        translations: JSON.parse(r.translations_json),
        keyword_hints: JSON.parse(r.keyword_hints_json),
    }));
}

// 사용자 + 자격증으로 전체 problems/concepts (status='done'만)
export async function listProblemsForUserLicence(userId, licenceId) {
    const db = getDb();
    const res = await db.execute({
        sql: `SELECT p.* FROM problems p
              JOIN sources s ON p.source_id = s.id
              WHERE s.user_id = ? AND s.licence_id = ? AND s.status = 'done'`,
        args: [userId, licenceId],
    });
    return res.rows.map(r => ({
        id: r.id,
        source_id: r.source_id,
        ko_question: r.ko_question,
        ko_options: JSON.parse(r.ko_options_json),
        correct_answer: Number(r.correct_answer),
        ko_explanation: r.ko_explanation,
        translations: JSON.parse(r.translations_json),
        keyword_hints: JSON.parse(r.keyword_hints_json),
    }));
}

export async function listConceptsForUserLicence(userId, licenceId) {
    const db = getDb();
    const res = await db.execute({
        sql: `SELECT c.* FROM concepts c
              JOIN sources s ON c.source_id = s.id
              WHERE s.user_id = ? AND s.licence_id = ? AND s.status = 'done'`,
        args: [userId, licenceId],
    });
    return res.rows;
}
