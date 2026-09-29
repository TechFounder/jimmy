-- LOCAL TEST FIXTURE ONLY. The real schema is owned by the noordinary repo
-- (migrations/0001_create_contact_sends.sql) and applied remotely from there.
-- This repo only binds the shared contact-sends database.
CREATE TABLE IF NOT EXISTS contact_sends (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  site    TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_sends_site_sent_at ON contact_sends (site, sent_at);
