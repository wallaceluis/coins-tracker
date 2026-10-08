/**
 * Esquema do banco. Idempotente: roda no primeiro uso de cada instância,
 * então não há passo manual de migração.
 */
export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS alerts (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT        NOT NULL,
  kind            TEXT        NOT NULL CHECK (kind IN ('crypto', 'stock')),
  symbol          TEXT        NOT NULL,
  name            TEXT        NOT NULL,
  ticker          TEXT        NOT NULL,
  currency        TEXT        NOT NULL,
  condition       TEXT        NOT NULL CHECK (condition IN ('above', 'below')),
  target          NUMERIC     NOT NULL CHECK (target > 0),
  token           TEXT        NOT NULL UNIQUE,
  confirmed_at    TIMESTAMPTZ,
  triggered       BOOLEAN     NOT NULL DEFAULT FALSE,
  last_price      NUMERIC,
  last_checked_at TIMESTAMPTZ,
  last_sent_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alerts_email_idx ON alerts (lower(email));
CREATE INDEX IF NOT EXISTS alerts_active_idx ON alerts (kind, symbol) WHERE confirmed_at IS NOT NULL;

-- Um token por e-mail para a página "meus alertas" (enviado só para o próprio e-mail)
CREATE TABLE IF NOT EXISTS subscribers (
  email        TEXT PRIMARY KEY,
  manage_token TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cache de cotações da bolsa: o plano grátis da brapi tem limite mensal
CREATE TABLE IF NOT EXISTS quote_cache (
  symbol     TEXT PRIMARY KEY,
  data       JSONB       NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`
