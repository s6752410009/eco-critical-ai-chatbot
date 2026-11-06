CREATE TABLE school_ai_usage (
 id TEXT PRIMARY KEY,
 created_at INTEGER NOT NULL,
 purpose TEXT NOT NULL,
 model TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 input_tokens INTEGER,
 cached_tokens INTEGER,
 cache_write_tokens INTEGER,
 output_tokens INTEGER,
 cost_nano INTEGER,
 pricing TEXT,
 response_id TEXT
);
CREATE INDEX school_ai_usage_created ON school_ai_usage(created_at);
INSERT INTO school_settings(key,value,updated_at) VALUES('ai_budget','{"monthlyUsd":10,"warningPercent":80}',CAST(strftime('%s','now') AS INTEGER)*1000);
