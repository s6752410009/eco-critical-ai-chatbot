CREATE TABLE IF NOT EXISTS discussions (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, alias TEXT NOT NULL,
 case_id TEXT NOT NULL DEFAULT '', author_hash TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS discussion_replies (
 id TEXT PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
 body TEXT NOT NULL, alias TEXT NOT NULL, author_hash TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS discussion_created ON discussions(created_at DESC, id);
CREATE INDEX IF NOT EXISTS reply_thread ON discussion_replies(thread_id, created_at);
CREATE TABLE IF NOT EXISTS discussion_limits (
 bucket TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 1, expires_at INTEGER NOT NULL
);
