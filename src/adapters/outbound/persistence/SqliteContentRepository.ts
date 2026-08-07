import type { DatabaseSync } from "node:sqlite";
import type { ContentRepository, ContentPage, ContentQuery, UpsertResult } from "../../../ports/ContentRepository.js";
import type { ContentItem } from "../../../domain/entities/ContentItem.js";
import { contentFromRow } from "./mappers.js";

export class SqliteContentRepository implements ContentRepository {
  private transactionDepth = 0;
  constructor(private readonly db: DatabaseSync) {}
  async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    if (this.transactionDepth) return operation();
    this.db.exec("BEGIN IMMEDIATE"); this.transactionDepth++;
    try { const result=await operation(); this.db.exec("COMMIT"); return result; }
    catch(error){ this.db.exec("ROLLBACK"); throw error; }
    finally { this.transactionDepth--; }
  }
  async upsert(item: ContentItem): Promise<UpsertResult> {
    const existingByUid = item.externalUid ? await this.findByExternalUid(item.sourceId,item.externalUid) : null;
    const existing = existingByUid ?? await this.findByCanonicalUrlHash(item.canonicalUrlHash);
    if (!existing) {
      this.db.prepare(`INSERT INTO content_items (id,source_id,external_uid,raw_url,canonical_url,canonical_url_hash,title,subtitle,image_url,author,published_at,first_seen_at,last_seen_at,content_hash,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(item.id,item.sourceId,item.externalUid,item.rawUrl,item.canonicalUrl,item.canonicalUrlHash,item.title,item.subtitle,item.imageUrl,item.author,item.publishedAt,item.firstSeenAt,item.lastSeenAt,item.contentHash,item.status);
      return { action:"inserted", item };
    }
    if (existing.contentHash === item.contentHash) {
      this.db.prepare("UPDATE content_items SET last_seen_at=? WHERE id=?").run(item.lastSeenAt,existing.id);
      return { action:"duplicate", item:{...existing,lastSeenAt:item.lastSeenAt} };
    }
    const updated={...item,id:existing.id,firstSeenAt:existing.firstSeenAt};
    this.db.prepare(`UPDATE content_items SET external_uid=?,raw_url=?,canonical_url=?,canonical_url_hash=?,title=?,subtitle=?,image_url=?,author=?,published_at=?,last_seen_at=?,content_hash=?,status=? WHERE id=?`).run(updated.externalUid,updated.rawUrl,updated.canonicalUrl,updated.canonicalUrlHash,updated.title,updated.subtitle,updated.imageUrl,updated.author,updated.publishedAt,updated.lastSeenAt,updated.contentHash,updated.status,updated.id);
    return { action:"updated", item:updated };
  }
  async findById(id:string){ const row=this.db.prepare(`SELECT c.*,s.name source_name FROM content_items c JOIN sources s ON s.id=c.source_id WHERE c.id=?`).get(id) as Record<string,unknown>|undefined; return row?{...contentFromRow(row),sourceName:String(row.source_name)}:null; }
  async findByExternalUid(sourceId:string,externalUid:string){ const row=this.db.prepare("SELECT * FROM content_items WHERE source_id=? AND external_uid=?").get(sourceId,externalUid) as Record<string,unknown>|undefined; return row?contentFromRow(row):null; }
  async findByCanonicalUrlHash(hash:string){ const row=this.db.prepare("SELECT * FROM content_items WHERE canonical_url_hash=?").get(hash) as Record<string,unknown>|undefined; return row?contentFromRow(row):null; }
  async list(query:ContentQuery):Promise<ContentPage>{
    const where=["c.status='ACTIVE'"]; const params:Array<string|number>=[];
    if(query.sourceId){where.push("c.source_id=?");params.push(query.sourceId);}
    if(query.search){where.push("(c.title LIKE ? ESCAPE '\\' OR c.subtitle LIKE ? ESCAPE '\\')");const q=`%${query.search.replace(/[\\%_]/g,"\\$&")}%`;params.push(q,q);}
    if(query.from){where.push("COALESCE(c.published_at,c.first_seen_at)>=?");params.push(query.from);}
    if(query.to){where.push("COALESCE(c.published_at,c.first_seen_at)<=?");params.push(query.to);}
    let offset=0; if(query.cursor){const parsed=Number(Buffer.from(query.cursor,"base64url").toString());if(Number.isInteger(parsed)&&parsed>=0)offset=parsed;}
    const direction=query.sort==="oldest"?"ASC":"DESC";
    const rows=this.db.prepare(`SELECT c.*,s.name source_name FROM content_items c JOIN sources s ON s.id=c.source_id WHERE ${where.join(" AND ")} ORDER BY COALESCE(c.published_at,c.first_seen_at) ${direction},c.id ${direction} LIMIT ? OFFSET ?`).all(...params,query.limit+1,offset) as Record<string,unknown>[];
    const hasMore=rows.length>query.limit; const visible=rows.slice(0,query.limit);
    return {items:visible.map(row=>({...contentFromRow(row),sourceName:String(row.source_name)})),nextCursor:hasMore?Buffer.from(String(offset+query.limit)).toString("base64url"):null};
  }
  async delete(id:string){return this.db.prepare("UPDATE content_items SET status='DELETED' WHERE id=?").run(id).changes>0;}
}
