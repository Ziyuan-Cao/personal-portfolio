import type { DatabaseSync } from "node:sqlite";

export function migrate(database: DatabaseSync): void {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      collection_url TEXT NOT NULL,
      feed_url TEXT,
      adapter_type TEXT NOT NULL,
      adapter_config TEXT NOT NULL DEFAULT '{}',
      interval_minutes INTEGER NOT NULL,
      max_items_per_run INTEGER NOT NULL DEFAULT 30,
      enabled INTEGER NOT NULL DEFAULT 0,
      etag TEXT,
      last_modified TEXT,
      last_collected_at TEXT,
      next_collection_at TEXT NOT NULL,
      failure_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      external_uid TEXT,
      raw_url TEXT NOT NULL,
      canonical_url TEXT NOT NULL,
      canonical_url_hash TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT,
      author TEXT,
      published_at TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      UNIQUE(source_id, external_uid),
      UNIQUE(canonical_url_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_content_published_at ON content_items(published_at);
    CREATE INDEX IF NOT EXISTS idx_content_source_id ON content_items(source_id);
    CREATE INDEX IF NOT EXISTS idx_content_first_seen_at ON content_items(first_seen_at);

    CREATE TABLE IF NOT EXISTS collection_runs (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT NOT NULL,
      fetched_count INTEGER NOT NULL DEFAULT 0,
      inserted_count INTEGER NOT NULL DEFAULT 0,
      updated_count INTEGER NOT NULL DEFAULT 0,
      duplicate_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_runs_source_started ON collection_runs(source_id, started_at DESC);
  `);
}
