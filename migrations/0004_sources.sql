CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    licence_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    original_filename TEXT,
    raw_text TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    status_message TEXT,
    domain_score REAL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sources_user_licence ON sources(user_id, licence_id);

CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL UNIQUE REFERENCES sources(id) ON DELETE CASCADE,
    ko_text TEXT NOT NULL,
    vi_text TEXT,
    zh_text TEXT,
    th_text TEXT,
    tl_text TEXT,
    my_text TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    korean TEXT NOT NULL,
    korean_definition TEXT NOT NULL,
    pronunciation TEXT,
    category TEXT,
    vi TEXT, zh TEXT, th TEXT, tl TEXT, my TEXT,
    vi_def TEXT, zh_def TEXT, th_def TEXT, tl_def TEXT, my_def TEXT,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_concepts_source ON concepts(source_id);

CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    ko_question TEXT NOT NULL,
    ko_options_json TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    ko_explanation TEXT NOT NULL,
    ko_simple_explanation TEXT,
    translations_json TEXT NOT NULL,
    keyword_hints_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_problems_source ON problems(source_id);
