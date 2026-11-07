CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  img TEXT,
  path TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  img TEXT,
  detail_img TEXT,
  type TEXT,
  standard TEXT,
  materials TEXT[] NOT NULL DEFAULT '{}',
  coatings TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT,
  description TEXT,
  specs TEXT[] NOT NULL DEFAULT '{}',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS products_type_idx ON products (type);
CREATE INDEX IF NOT EXISTS products_standard_idx ON products (standard);

CREATE TABLE IF NOT EXISTS filters (
  key TEXT PRIMARY KEY,
  type JSONB NOT NULL DEFAULT '[]'::jsonb,
  standard JSONB NOT NULL DEFAULT '[]'::jsonb,
  material JSONB NOT NULL DEFAULT '[]'::jsonb,
  coating JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Заявки перенесены в отдельную БД bazmet_orders (customers + orders)

-- Бинарные файлы картинок (JPG) — сами байты в PostgreSQL
CREATE TABLE IF NOT EXISTS images (
  path TEXT PRIMARY KEY,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data BYTEA NOT NULL
);
