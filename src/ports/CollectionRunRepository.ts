import type { CollectionRun } from "../domain/entities/CollectionRun.js";
export interface CollectionRunRepository {
  create(run: CollectionRun): Promise<CollectionRun>;
  update(run: CollectionRun): Promise<CollectionRun>;
  findById(id: string): Promise<(CollectionRun & { sourceName: string }) | null>;
  list(limit: number): Promise<Array<CollectionRun & { sourceName: string }>>;
}
