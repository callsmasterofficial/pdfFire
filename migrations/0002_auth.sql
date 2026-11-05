-- Credentials and sessions.
--
-- Password stretching happens in the browser, not here. Measured in workerd,
-- the engine Pages Functions run on: PBKDF2-SHA256 costs 9 ms at 100,000
-- iterations and 17 ms at the 210,000 OWASP currently recommends, against a
-- 10 ms CPU budget per request on the Workers free plan. A login that spends
-- its entire budget on the hash has nothing left to answer with.
--
-- So the client derives an auth key from the password with 600,000 iterations
-- — free, and far above what the server could afford — and the server treats
-- that key as the secret, stretching it again cheaply before storing it. An
-- attacker with the database still has to work back through the client-side
-- derivation, so the offline cost is preserved rather than traded away. The
-- design follows Mozilla's onepw protocol rather than being invented here.

CREATE TABLE credentials (
  account_id       TEXT PRIMARY KEY REFERENCES accounts(id),
  -- PBKDF2-SHA256 over the client-derived auth key. Hex, not base64, so it
  -- can be compared without decoding.
  password_hash    TEXT NOT NULL,
  password_salt    TEXT NOT NULL,
  -- Recorded per row so the cost can be raised later without invalidating
  -- every existing credential.
  iterations       INTEGER NOT NULL,
  -- Which client-side derivation produced the auth key this hash covers.
  client_iterations INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

-- A session row is keyed on the SHA-256 of the token, never the token itself:
-- a leaked database must not hand over usable sessions.
CREATE TABLE sessions (
  token_hash   TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL REFERENCES accounts(id),
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at   INTEGER
);
CREATE INDEX sessions_account ON sessions(account_id);
CREATE INDEX sessions_expiry ON sessions(expires_at) WHERE revoked_at IS NULL;

-- Failed attempts, so a password can be rate-limited per account without a
-- separate store. Rows are pruned on success.
CREATE TABLE login_attempts (
  email_key    TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);
CREATE INDEX login_attempts_key ON login_attempts(email_key, attempted_at);
