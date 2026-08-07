import type { DatabaseSync } from "node:sqlite";
import type { CollectionRunRepository } from "../../../ports/CollectionRunRepository.js";
import type { CollectionRun } from "../../../domain/entities/CollectionRun.js";
import { runFromRow } from "./mappers.js";
export class SqliteCollectionRunRepository implements CollectionRunRepository {
  constructor(private readonly db:DatabaseSync){}
  async create(run:CollectionRun){this.db.prepare(`INSERT INTO collection_runs (id,source_id,started_at,completed_at,status,fetched_count,inserted_count,updated_count,duplicate_count,error_count,error_message) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(run.id,run.sourceId,run.startedAt,run.completedAt,run.status,run.fetchedCount,run.insertedCount,run.updatedCount,run.duplicateCount,run.errorCount,run.errorMessage);return run;}
  async update(run:CollectionRun){this.db.prepare(`UPDATE collection_runs SET completed_at=?,status=?,fetched_count=?,inserted_count=?,updated_count=?,duplicate_count=?,error_count=?,error_message=? WHERE id=?`).run(run.completedAt,run.status,run.fetchedCount,run.insertedCount,run.updatedCount,run.duplicateCount,run.errorCount,run.errorMessage,run.id);return run;}
  async findById(id:string){const row=this.db.prepare(`SELECT r.*,s.name source_name FROM collection_runs r JOIN sources s ON s.id=r.source_id WHERE r.id=?`).get(id) as Record<string,unknown>|undefined;return row?{...runFromRow(row),sourceName:String(row.source_name)}:null;}
  async list(limit:number){return (this.db.prepare(`SELECT r.*,s.name source_name FROM collection_runs r JOIN sources s ON s.id=r.source_id ORDER BY r.started_at DESC LIMIT ?`).all(limit) as Record<string,unknown>[]).map(row=>({...runFromRow(row),sourceName:String(row.source_name)}));}
}
