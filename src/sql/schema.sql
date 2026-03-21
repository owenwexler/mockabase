CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  encrypted_password TEXT,
  phone_number TEXT UNIQUE,
  oauth_provider TEXT,
  provider_type TEXT,
  email_confirmed_at TEXT, -- dummy field
  otp TEXT,
  created_at TEXT,
  updated_at TEXT
);
