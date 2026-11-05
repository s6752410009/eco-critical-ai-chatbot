ALTER TABLE school_progress ADD COLUMN completed_at INTEGER;
UPDATE school_progress SET completed_at=updated_at WHERE percent=100 AND completed_at IS NULL;
