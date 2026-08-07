import type { ContentItem } from "../domain/entities/ContentItem.js";
export interface ContentQuery { sourceId?: string; search?: string; from?: string; to?: string; cursor?: string; limit: number; sort: "newest" | "oldest"; }
export interface ContentPage { items: Array<ContentItem & { sourceName: string }>; nextCursor: string | null; }
export interface UpsertResult { action: "inserted" | "updated" | "duplicate"; item: ContentItem; }
export interface ContentRepository {
  upsert(item: ContentItem): Promise<UpsertResult>;
  withTransaction<T>(operation: () => Promise<T>): Promise<T>;
  findById(id: string): Promise<(ContentItem & { sourceName: string }) | null>;
  findByExternalUid(sourceId: string, externalUid: string): Promise<ContentItem | null>;
  findByCanonicalUrlHash(hash: string): Promise<ContentItem | null>;
  list(query: ContentQuery): Promise<ContentPage>;
  delete(id: string): Promise<boolean>;
}
