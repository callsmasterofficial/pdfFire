-- FileMelo account and billing control plane.
--
-- Document content never appears here and must never be added: this schema
-- holds who someone is, what they bought, and what they are therefore allowed
-- to do. Everything else stays in the browser.

CREATE TABLE accounts (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  -- Lowercased and trimmed; the unique index is on this, not on `email`, so
  -- two people cannot register the same address in different cases.
  email_key     TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  deleted_at    INTEGER
);
CREATE UNIQUE INDEX accounts_email_key ON accounts(email_key);

CREATE TABLE organizations (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  owner_id      TEXT NOT NULL REFERENCES accounts(id),
  seats_paid    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE memberships (
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  account_id      TEXT NOT NULL REFERENCES accounts(id),
  role            TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at      INTEGER NOT NULL,
  PRIMARY KEY (organization_id, account_id)
);
CREATE INDEX memberships_account ON memberships(account_id);

CREATE TABLE invitations (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  email_key       TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  expires_at      INTEGER NOT NULL,
  accepted_at     INTEGER,
  created_at      INTEGER NOT NULL
);
CREATE INDEX invitations_org ON invitations(organization_id);

-- One row per provider subscription. `provider_customer_id` is how a webhook
-- finds its way back to an account without trusting an email string in the
-- payload.
CREATE TABLE subscriptions (
  id                   TEXT PRIMARY KEY,
  account_id           TEXT REFERENCES accounts(id),
  organization_id      TEXT REFERENCES organizations(id),
  provider             TEXT NOT NULL,
  provider_customer_id TEXT NOT NULL,
  provider_product_id  TEXT NOT NULL,
  plan                 TEXT NOT NULL CHECK (plan IN ('pro', 'teams')),
  interval             TEXT NOT NULL CHECK (interval IN ('monthly', 'annual')),
  status               TEXT NOT NULL,
  quantity             INTEGER NOT NULL DEFAULT 1,
  current_period_end   INTEGER,
  cancel_at            INTEGER,
  -- The provider's own ordering, so a delayed event cannot overwrite a newer
  -- state. See webhook-state.ts.
  provider_updated_at  INTEGER NOT NULL DEFAULT 0,
  updated_at           INTEGER NOT NULL,
  -- A subscription belongs to a person or an organization, never both. It may
  -- briefly belong to neither: a webhook can arrive for a customer who has not
  -- signed in yet, and dropping that event would drop a payment that happened.
  CHECK (NOT (account_id IS NOT NULL AND organization_id IS NOT NULL))
);
CREATE INDEX subscriptions_customer ON subscriptions(provider, provider_customer_id);
CREATE INDEX subscriptions_account ON subscriptions(account_id);
CREATE INDEX subscriptions_org ON subscriptions(organization_id);

-- Every webhook delivery, stored before it is acted on. The primary key is the
-- provider's event id, which is what makes redelivery a no-op rather than a
-- second charge applied twice.
CREATE TABLE webhook_events (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL,
  type          TEXT NOT NULL,
  payload       TEXT NOT NULL,
  received_at   INTEGER NOT NULL,
  processed_at  INTEGER,
  error         TEXT,
  attempts      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX webhook_events_unprocessed ON webhook_events(processed_at) WHERE processed_at IS NULL;

CREATE TABLE consents (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts(id),
  kind        TEXT NOT NULL,
  version     TEXT NOT NULL,
  granted     INTEGER NOT NULL CHECK (granted IN (0, 1)),
  recorded_at INTEGER NOT NULL
);
CREATE INDEX consents_account ON consents(account_id, kind);
