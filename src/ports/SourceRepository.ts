import type { Source } from "../domain/entities/Source.js";
export interface SourceRepository {
  create(source: Source): Promise<Source>;
  update(source: Source): Promise<Source>;
  findById(id: string): Promise<Source | null>;
  list(): Promise<Source[]>;
  listDue(now: string): Promise<Source[]>;
  delete(id: string): Promise<boolean>;
}
