-- One-time migration for existing D1 databases created before arrivalTime
-- was added to schema.sql. Run this once:
--   npx wrangler d1 execute cpac_booking_db --remote --file=./migration_arrival_time.sql
-- Re-running will error with "duplicate column name" — that's expected and harmless.

ALTER TABLE bookings ADD COLUMN arrivalTime TEXT;
