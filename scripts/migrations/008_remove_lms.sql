-- Drops recorded-learning (LMS) tables and removes batches.course_id.
-- Safe to run once on existing databases; app bootstrap also migrates at runtime.

ALTER TABLE IF EXISTS batches DROP CONSTRAINT IF EXISTS batches_course_id_fkey;
DROP INDEX IF EXISTS idx_batches_course_id;
ALTER TABLE IF EXISTS batches DROP COLUMN IF EXISTS course_id;

DROP TABLE IF EXISTS course_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
