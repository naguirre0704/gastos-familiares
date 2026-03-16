-- ================================================================
-- Gastos Familiares — Supabase Schema
-- Run this in the Supabase SQL Editor (https://app.supabase.com)
-- ================================================================

-- Gastos (expense records)
CREATE TABLE IF NOT EXISTS gastos (
  id          TEXT PRIMARY KEY,
  fecha       TEXT NOT NULL,
  hora        TEXT NOT NULL,
  monto       INTEGER NOT NULL,
  comercio    TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT '',
  cuenta      TEXT NOT NULL DEFAULT '',
  gmail_id    TEXT NOT NULL DEFAULT '',
  creado_por  TEXT NOT NULL DEFAULT '',
  notas       TEXT NOT NULL DEFAULT '',
  comentario  TEXT,
  tipo        TEXT CHECK (tipo IN ('compra', 'transferencia')),
  emoji       TEXT
);

-- Categorias
CREATE TABLE IF NOT EXISTS categorias (
  nombre              TEXT PRIMARY KEY,
  emoji               TEXT NOT NULL,
  color               TEXT NOT NULL,
  presupuesto_mensual INTEGER NOT NULL DEFAULT 0,
  activa              BOOLEAN NOT NULL DEFAULT true
);

-- Comercios (merchant-category memory)
CREATE TABLE IF NOT EXISTS comercios (
  comercio    TEXT PRIMARY KEY,
  categoria   TEXT NOT NULL,
  veces_usado INTEGER NOT NULL DEFAULT 1,
  ultima_vez  TEXT NOT NULL DEFAULT ''
);

-- Presupuestos mensuales
CREATE TABLE IF NOT EXISTS presupuestos (
  mes         TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  presupuesto INTEGER NOT NULL,
  PRIMARY KEY (mes, categoria)
);

-- Historial de importaciones desde Gmail
CREATE TABLE IF NOT EXISTS importaciones (
  id          TEXT PRIMARY KEY,
  timestamp   TEXT NOT NULL,
  cantidad    INTEGER NOT NULL,
  desde_date  TEXT NOT NULL DEFAULT '2025/12/31'
);

-- Tokens OAuth de Gmail (una sola fila, id siempre = 1)
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id     INTEGER PRIMARY KEY DEFAULT 1,
  tokens JSONB NOT NULL
);

-- Enable RLS on all tables (defense in depth)
-- The app uses service_role key server-side which bypasses RLS,
-- but RLS protects against accidental anon/public key exposure.
ALTER TABLE gastos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comercios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE importaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_tokens  ENABLE ROW LEVEL SECURITY;

-- Deny all access via anon/authenticated roles (service_role bypasses this)
CREATE POLICY "deny_all_gastos"        ON gastos        FOR ALL USING (false);
CREATE POLICY "deny_all_categorias"    ON categorias    FOR ALL USING (false);
CREATE POLICY "deny_all_comercios"     ON comercios     FOR ALL USING (false);
CREATE POLICY "deny_all_presupuestos"  ON presupuestos  FOR ALL USING (false);
CREATE POLICY "deny_all_importaciones" ON importaciones FOR ALL USING (false);
CREATE POLICY "deny_all_gmail_tokens"  ON gmail_tokens  FOR ALL USING (false);
