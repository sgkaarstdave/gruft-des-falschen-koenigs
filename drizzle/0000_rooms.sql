CREATE TABLE rooms (
  code TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL,
  saved INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX rooms_saved ON rooms(saved);
