CREATE TABLE IF NOT EXISTS school_chat_messages (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES school_users(id) ON DELETE CASCADE,
 lesson_id TEXT NOT NULL DEFAULT '', role TEXT NOT NULL CHECK(role IN ('user','assistant')),
 text TEXT NOT NULL, sources TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS school_chat_user ON school_chat_messages(user_id,created_at);
