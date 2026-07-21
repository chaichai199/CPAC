-- One-time migration for existing D1 databases created before shippingFee
-- support was added. Run once:
--   npx wrangler d1 execute cpac_booking_db --remote --file=./migration_shipping_fee.sql
-- Re-running the ALTER TABLE ADD COLUMN statement will error with
-- "duplicate column name" — that's expected and harmless if you re-run this.

ALTER TABLE bookings ADD COLUMN shippingFee REAL NOT NULL DEFAULT 0;

-- option_items.listKey has a CHECK constraint that doesn't yet allow
-- 'shippingFee'. SQLite can't alter a CHECK constraint in place, so the
-- table is rebuilt with the wider constraint, preserving all existing rows.
CREATE TABLE option_items_new (
  id TEXT PRIMARY KEY,
  listKey TEXT NOT NULL CHECK (listKey IN ('concreteStrength', 'mixerType', 'pourMethod', 'jobType', 'seller', 'shippingFee')),
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0
);

INSERT INTO option_items_new SELECT * FROM option_items;
DROP TABLE option_items;
ALTER TABLE option_items_new RENAME TO option_items;
CREATE INDEX IF NOT EXISTS idx_option_items_listKey ON option_items (listKey);

INSERT OR IGNORE INTO option_items (id, listKey, value, active, sortOrder) VALUES
  ('opt-sf-1', 'shippingFee', '0', 1, 0),
  ('opt-sf-2', 'shippingFee', '375', 1, 1),
  ('opt-sf-3', 'shippingFee', '750', 1, 2);
