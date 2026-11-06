CREATE TABLE IF NOT EXISTS school_images (
 id TEXT PRIMARY KEY,
 mime TEXT NOT NULL,
 content TEXT NOT NULL,
 created_by TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
