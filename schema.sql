-- BURAPACONCRETE CPAC Booking — Cloudflare D1 schema

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  customerName TEXT NOT NULL,
  phone TEXT NOT NULL,
  deliveryDate TEXT NOT NULL,
  deliveryTime TEXT NOT NULL,
  arrivalTime TEXT,
  concreteStrength TEXT NOT NULL,
  volume REAL NOT NULL,
  mixerType TEXT NOT NULL,
  pourMethod TEXT NOT NULL,
  jobType TEXT NOT NULL,
  contactPerson TEXT NOT NULL,
  contactPhone TEXT NOT NULL,
  mapLink TEXT NOT NULL,
  sellerName TEXT NOT NULL,
  pricePerUnit REAL NOT NULL,
  discount REAL NOT NULL,
  shippingFee REAL NOT NULL DEFAULT 0,
  totalPrice REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'dispatched', 'completed', 'cancelled')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  createdBy TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_deliveryDate ON bookings (deliveryDate);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  userName TEXT NOT NULL,
  userRole TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  bookingCode TEXT
);

CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log (timestamp);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  displayName TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff'))
);

-- Seed the original demo accounts so logins keep working after moving
-- auth off the static DEMO_USERS array. Safe to re-run (INSERT OR IGNORE).
INSERT OR IGNORE INTO users (id, username, password, displayName, role) VALUES
  ('u-admin-1', 'admin', 'admin123', 'ผู้ดูแลระบบ (Admin)', 'admin'),
  ('u-staff-1', 'staff', 'staff123', 'เจ้าหน้าที่คีย์งาน', 'staff');

CREATE TABLE IF NOT EXISTS option_items (
  id TEXT PRIMARY KEY,
  listKey TEXT NOT NULL CHECK (listKey IN ('concreteStrength', 'mixerType', 'pourMethod', 'jobType', 'seller', 'shippingFee')),
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_option_items_listKey ON option_items (listKey);

-- Seed the admin-editable option lists (concrete strength, mixer type, pour
-- method, job type, seller) from the app's original static defaults so the
-- booking form keeps working identically after moving these to the DB.
-- Safe to re-run (INSERT OR IGNORE).
INSERT OR IGNORE INTO option_items (id, listKey, value, active, sortOrder) VALUES
  ('opt-cs-1', 'concreteStrength', '180 ksc', 1, 0),
  ('opt-cs-2', 'concreteStrength', '210 ksc', 1, 1),
  ('opt-cs-3', 'concreteStrength', '240 ksc', 1, 2),
  ('opt-cs-4', 'concreteStrength', '280 ksc', 1, 3),
  ('opt-cs-5', 'concreteStrength', '320 ksc', 1, 4),
  ('opt-cs-6', 'concreteStrength', '350 ksc', 1, 5),
  ('opt-mt-1', 'mixerType', 'รถโม่ 6 คิว', 1, 0),
  ('opt-mt-2', 'mixerType', 'รถโม่ 7 คิว', 1, 1),
  ('opt-mt-3', 'mixerType', 'รถโม่ 10 คิว', 1, 2),
  ('opt-mt-4', 'mixerType', 'ปั๊มคอนกรีต', 1, 3),
  ('opt-pm-1', 'pourMethod', 'เทตรงจากรถโม่ (ไหลตามราง)', 1, 0),
  ('opt-pm-2', 'pourMethod', 'ใช้รถปั๊มลากท่อ (Line Pump)', 1, 1),
  ('opt-pm-3', 'pourMethod', 'ใช้รถปั๊มบูม (Boom Pump 32m)', 1, 2),
  ('opt-pm-4', 'pourMethod', 'ใช้รถปั๊มบูม (Boom Pump 42m)', 1, 3),
  ('opt-pm-5', 'pourMethod', 'ใช้เครนหิ้วพ็อกเก็ต (Crane Pocket)', 1, 4),
  ('opt-pm-6', 'pourMethod', 'เทรถเข็น / อื่นๆ', 1, 5),
  ('opt-jt-1', 'jobType', 'ฐานราก', 1, 0),
  ('opt-jt-2', 'jobType', 'เสา', 1, 1),
  ('opt-jt-3', 'jobType', 'คาน', 1, 2),
  ('opt-jt-4', 'jobType', 'พื้น', 1, 3),
  ('opt-jt-5', 'jobType', 'ถนน', 1, 4),
  ('opt-jt-6', 'jobType', 'กำแพงกันดิน', 1, 5),
  ('opt-jt-7', 'jobType', 'อื่นๆ', 1, 6),
  ('opt-sl-1', 'seller', 'คุณสมชาย ใจดี', 1, 0),
  ('opt-sl-2', 'seller', 'คุณวราภรณ์ ศรีสุข', 1, 1),
  ('opt-sl-3', 'seller', 'คุณอนุชา พงษ์พันธ์', 1, 2),
  ('opt-sl-4', 'seller', 'คุณกัญญา ทองแท้', 1, 3),
  ('opt-sf-1', 'shippingFee', '0', 1, 0),
  ('opt-sf-2', 'shippingFee', '375', 1, 1),
  ('opt-sf-3', 'shippingFee', '750', 1, 2);
