-- Generalises the attempt counter so registration can be limited too.
--
-- Login was limited per address from the start. Registration was not, and the
-- client-side derivation does not help: an attacker writes their own client,
-- so they can send any well-formed auth key without doing the work. Left as
-- it was, a public registration endpoint is an invitation to fill the accounts
-- table.
--
-- The column becomes `subject` because it now holds either an email key or an
-- address, distinguished by prefix.
ALTER TABLE login_attempts RENAME TO auth_attempts;
ALTER TABLE auth_attempts RENAME COLUMN email_key TO subject;
DROP INDEX IF EXISTS login_attempts_key;
CREATE INDEX auth_attempts_subject ON auth_attempts(subject, attempted_at);
