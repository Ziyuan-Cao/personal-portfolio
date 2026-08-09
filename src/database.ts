import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { sourceName } from "./utils.js";

export interface InformationItem {
  uid: string;
  canonicalUrl: string;
  sourceUrl: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  seenAt: string;
}

interface ListQuery {
  sourceUrl?: string;
  search?: string;
  sort: "newest" | "oldest";
  cursor?: string;
  limit: number;
}

interface InformationRow {
  id: string;
  uid: string;
  canonical_url: string;
  source_url: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  published_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export class InformationDatabase {
  constructor(private readonly database: DatabaseSync) {}

  upsert(item: InformationItem): boolean {
    const existing = this.database.prepare(
      "SELECT id FROM information WHERE uid = ? OR canonical_url = ? LIMIT 1",
    ).get(item.uid, item.canonicalUrl) as { id: string } | undefined;

    if (existing) {
      this.database.prepare(`
        UPDATE information SET
          source_url = ?, title = ?, subtitle = ?, image_url = ?, published_at = ?, last_seen_at = ?
        WHERE id = ?
      `).run(item.sourceUrl, item.title, item.subtitle, item.imageUrl, item.publishedAt, item.seenAt, existing.id);
      return false;
    }

    this.database.prepare(`
      INSERT INTO information
        (id, uid, canonical_url, source_url, title, subtitle, image_url, published_at, first_seen_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), item.uid, item.canonicalUrl, item.sourceUrl, item.title, item.subtitle,
      item.imageUrl, item.publishedAt, item.seenAt, item.seenAt,
    );
    return true;
  }

  list(query: ListQuery) {
    const where: string[] = [];
    const parameters: Array<string | number> = [];
    if (query.sourceUrl) {
      where.push("source_url = ?");
      parameters.push(query.sourceUrl);
    }
    if (query.search) {
      where.push("(title LIKE ? ESCAPE '\\' OR subtitle LIKE ? ESCAPE '\\')");
      const escaped = `%${query.search.replace(/[\\%_]/g, "\\$&")}%`;
      parameters.push(escaped, escaped);
    }
    const parsedOffset = query.cursor
      ? Number(Buffer.from(query.cursor, "base64url").toString("utf8"))
      : 0;
    const offset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const direction = query.sort === "oldest" ? "ASC" : "DESC";
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = this.database.prepare(`
      SELECT * FROM information ${clause}
      ORDER BY COALESCE(published_at, first_seen_at) ${direction}, id ${direction}
      LIMIT ? OFFSET ?
    `).all(...parameters, query.limit + 1, offset) as unknown as InformationRow[];
    const hasMore = rows.length > query.limit;
    const items = rows.slice(0, query.limit).map((row) => ({
      id: row.id,
      uid: row.uid,
      url: row.canonical_url,
      canonicalUrl: row.canonical_url,
      sourceUrl: row.source_url,
      sourceName: sourceName(row.source_url),
      title: row.title,
      subtitle: row.subtitle,
      imageUrl: row.image_url,
      publishedAt: row.published_at,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
    }));
    const sources = (this.database.prepare("SELECT DISTINCT source_url FROM information ORDER BY source_url").all() as unknown as Array<{ source_url: string }>).map((row) => ({
      url: row.source_url,
      name: sourceName(row.source_url),
    }));
    return {
      items,
      sources,
      nextCursor: hasMore ? Buffer.from(String(offset + query.limit)).toString("base64url") : null,
    };
  }

  transaction<T>(operation: () => T): T {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  close(): void {
    this.database.close();
  }
}

export function openDatabase(filename: string): InformationDatabase {
  if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });
  const database = new DatabaseSync(filename);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    DROP TABLE IF EXISTS portfolio_projects;
    DROP TABLE IF EXISTS collection_runs;
    DROP TABLE IF EXISTS content_items;
    DROP TABLE IF EXISTS sources;

    CREATE TABLE IF NOT EXISTS information (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      canonical_url TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT,
      published_at TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_information_uid ON information(uid);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_information_canonical_url ON information(canonical_url);
  `);
  return new InformationDatabase(database);
}
