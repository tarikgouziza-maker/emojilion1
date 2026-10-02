-- ============================================================================
-- Cloudflare D1 Initial Schema Migration for EmojiLion
-- Run via: npx wrangler d1 execute emojilion-db --file=migrations/0001_initial_schema.sql
-- ============================================================================

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'superadmin',
  created_at TEXT NOT NULL
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  emoji_count INTEGER DEFAULT 0,
  subcategories_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- 4. Emojis Table
CREATE TABLE IF NOT EXISTS emojis (
  id TEXT PRIMARY KEY,
  character TEXT NOT NULL,
  name TEXT NOT NULL,
  unicode_name TEXT,
  cldr_short_name TEXT,
  code_point TEXT NOT NULL,
  code_point_hex TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  keywords_json TEXT,
  description TEXT,
  custom_description TEXT,
  seo_title TEXT,
  is_featured INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  is_popular INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  copies_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_emojis_slug ON emojis(slug);
CREATE INDEX IF NOT EXISTS idx_emojis_category ON emojis(category);
CREATE INDEX IF NOT EXISTS idx_emojis_subcategory ON emojis(subcategory);
CREATE INDEX IF NOT EXISTS idx_emojis_character ON emojis(character);
CREATE INDEX IF NOT EXISTS idx_emojis_status ON emojis(status);
CREATE INDEX IF NOT EXISTS idx_emojis_is_featured ON emojis(is_featured);
CREATE INDEX IF NOT EXISTS idx_emojis_views ON emojis(views_count);
CREATE INDEX IF NOT EXISTS idx_emojis_copies ON emojis(copies_count);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 6. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 7. Daily Stats Table
CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT PRIMARY KEY,
  views INTEGER DEFAULT 0,
  copies INTEGER DEFAULT 0,
  searches INTEGER DEFAULT 0
);
