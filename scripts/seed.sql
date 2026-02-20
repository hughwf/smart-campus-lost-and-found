-- Smart Campus Lost & Found — Database Schema
-- Run against a fresh Vercel Postgres instance

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  phone           TEXT,
  image           TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Items table (lost and found)
CREATE TABLE IF NOT EXISTS items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  type            VARCHAR(5) NOT NULL CHECK (type IN ('lost', 'found')),
  title           TEXT NOT NULL,
  photo_url       TEXT,
  description     TEXT NOT NULL,
  location        TEXT,
  extracted       JSONB,
  taken           BOOLEAN,
  reward          TEXT,
  resolved        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id    UUID REFERENCES items(id),
  found_item_id   UUID REFERENCES items(id),
  score           FLOAT NOT NULL,
  reasoning       TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_type_resolved ON items(type, resolved);
CREATE INDEX IF NOT EXISTS idx_matches_lost_item_id ON matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found_item_id ON matches(found_item_id);

-- Unique constraint to prevent duplicate match pairs (enables upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_pair ON matches(lost_item_id, found_item_id);
