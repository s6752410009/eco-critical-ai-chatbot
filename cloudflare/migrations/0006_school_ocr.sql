CREATE TABLE school_ocr (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 mime TEXT NOT NULL,
 page_count INTEGER NOT NULL DEFAULT 1,
 image_id TEXT,
 pages TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'pending',
 error TEXT NOT NULL DEFAULT '',
 model TEXT,
 created_by TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE school_ocr_files (
 id TEXT NOT NULL REFERENCES school_ocr(id) ON DELETE CASCADE,
 part INTEGER NOT NULL,
 content TEXT NOT NULL,
 PRIMARY KEY(id, part)
);

UPDATE school_settings SET value='gpt-6-luna' WHERE key='openai_model' AND value IN ('gpt-4.1-mini','gpt-6.1-sol');
