-- D1 schema for SaintsTombs search
-- Run once: wrangler d1 execute saints-search --file=workers/search/schema.sql

CREATE TABLE IF NOT EXISTS saints (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  region    TEXT    NOT NULL,
  location  TEXT    NOT NULL,
  church    TEXT,
  entry     TEXT    NOT NULL
);

-- Full-text search virtual table backed by the saints table
CREATE VIRTUAL TABLE IF NOT EXISTS saints_fts USING fts5(
  entry,
  location,
  church,
  region,
  content=saints,
  content_rowid=id
);

-- Keep FTS in sync when rows are inserted
CREATE TRIGGER IF NOT EXISTS saints_ai AFTER INSERT ON saints BEGIN
  INSERT INTO saints_fts(rowid, entry, location, church, region)
    VALUES (new.id, new.entry, new.location, new.church, new.region);
END;

-- Keep FTS in sync when rows are deleted
CREATE TRIGGER IF NOT EXISTS saints_ad AFTER DELETE ON saints BEGIN
  INSERT INTO saints_fts(saints_fts, rowid, entry, location, church, region)
    VALUES ('delete', old.id, old.entry, old.location, old.church, old.region);
END;

-- Keep FTS in sync when rows are updated
CREATE TRIGGER IF NOT EXISTS saints_au AFTER UPDATE ON saints BEGIN
  INSERT INTO saints_fts(saints_fts, rowid, entry, location, church, region)
    VALUES ('delete', old.id, old.entry, old.location, old.church, old.region);
  INSERT INTO saints_fts(rowid, entry, location, church, region)
    VALUES (new.id, new.entry, new.location, new.church, new.region);
END;
