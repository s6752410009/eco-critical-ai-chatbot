CREATE TABLE IF NOT EXISTS school_users (
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, display_name TEXT NOT NULL,
 email TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL, salt TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','teacher','admin')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended')),
 must_change INTEGER NOT NULL DEFAULT 0, bootstrap_locked INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL, last_login INTEGER
);
CREATE TABLE IF NOT EXISTS school_sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES school_users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS school_session_user ON school_sessions(user_id);
CREATE TABLE IF NOT EXISTS school_curriculum (
 id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS school_progress (
 user_id TEXT NOT NULL REFERENCES school_users(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL,
 percent INTEGER NOT NULL DEFAULT 0, score INTEGER, total INTEGER, updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,lesson_id)
);
CREATE TABLE IF NOT EXISTS school_audit (
 id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, target_id TEXT, action TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS school_settings (
 key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS school_users_role_status ON school_users(role,status,created_at);
