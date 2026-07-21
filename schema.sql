-- BURAPACONCRETE CPAC Booking — Cloudflare D1 schema

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  customerName TEXT NOT NULL,
  phone TEXT NOT NULL,
  deliveryDate TEXT NOT NULL,
  deliveryTime TEXT NOT NULL,
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
