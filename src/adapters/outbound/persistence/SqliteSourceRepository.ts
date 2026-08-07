import type { DatabaseSync } from "node:sqlite";
import type { SourceRepository } from "../../../ports/SourceRepository.js";
import type { Source } from "../../../domain/entities/Source.js";
import { sourceFromRow } from "./mappers.js";

export class SqliteSourceRepository implements SourceRepository {
  constructor(private readonly db: DatabaseSync) {}
  async create(source: Source): Promise<Source> {
    this.db.prepare(`INSERT INTO sources (id,name,base_url,collection_url,feed_url,adapter_type,adapter_config,interval_minutes,max_items_per_run,enabled,etag,last_modified,last_collected_at,next_collection_at,failure_count,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(source.id,source.name,source.baseUrl,source.collectionUrl,source.feedUrl,source.adapterType,JSON.stringify(source.adapterConfig),source.intervalMinutes,source.maxItemsPerRun,Number(source.enabled),source.etag,source.lastModified,source.lastCollectedAt,source.nextCollectionAt,source.failureCount,source.status,source.createdAt,source.updatedAt);
    return source;
  }
  async update(source: Source): Promise<Source> {
    const result = this.db.prepare(`UPDATE sources SET name=?,base_url=?,collection_url=?,feed_url=?,adapter_type=?,adapter_config=?,interval_minutes=?,max_items_per_run=?,enabled=?,etag=?,last_modified=?,last_collected_at=?,next_collection_at=?,failure_count=?,status=?,updated_at=? WHERE id=?`).run(source.name,source.baseUrl,source.collectionUrl,source.feedUrl,source.adapterType,JSON.stringify(source.adapterConfig),source.intervalMinutes,source.maxItemsPerRun,Number(source.enabled),source.etag,source.lastModified,source.lastCollectedAt,source.nextCollectionAt,source.failureCount,source.status,source.updatedAt,source.id);
    if (!result.changes) throw new Error("Source not found");
    return source;
  }
  async findById(id: string): Promise<Source | null> { const row=this.db.prepare("SELECT * FROM sources WHERE id=?").get(id) as Record<string,unknown>|undefined; return row?sourceFromRow(row):null; }
  async list(): Promise<Source[]> { return (this.db.prepare("SELECT * FROM sources ORDER BY name COLLATE NOCASE").all() as Record<string,unknown>[]).map(sourceFromRow); }
  async listDue(now: string): Promise<Source[]> { return (this.db.prepare("SELECT * FROM sources WHERE enabled=1 AND status!='PAUSED' AND next_collection_at<=? ORDER BY next_collection_at").all(now) as Record<string,unknown>[]).map(sourceFromRow); }
  async delete(id: string): Promise<boolean> { return this.db.prepare("DELETE FROM sources WHERE id=?").run(id).changes > 0; }
}
