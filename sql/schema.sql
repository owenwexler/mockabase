CREATE DATABASE mockabase_db;

CREATE USER mockabase_user WITH PASSWORD 'mockabase123';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- run the following commands on both the main DB and the test DB
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  encrypted_password TEXT,
  phone_number TEXT UNIQUE,
  oauth_provider TEXT,
  provider_type TEXT,
  email_confirmed_at TIMESTAMPTZ, -- dummy field
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON ALL TABLES IN SCHEMA public TO mockabase_user;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO mockabase_user;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO mockabase_user;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO mockabase_user;
