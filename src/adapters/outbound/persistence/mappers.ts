import type { Source } from "../../../domain/entities/Source.js";
import type { ContentItem } from "../../../domain/entities/ContentItem.js";
import type { CollectionRun } from "../../../domain/entities/CollectionRun.js";

type Row = Record<string, unknown>;
export function sourceFromRow(row: Row): Source {
  return { id: String(row.id), name: String(row.name), baseUrl: String(row.base_url), collectionUrl: String(row.collection_url), feedUrl: row.feed_url ? String(row.feed_url) : null, adapterType: row.adapter_type as Source["adapterType"], adapterConfig: JSON.parse(String(row.adapter_config)), intervalMinutes: Number(row.interval_minutes), maxItemsPerRun: Number(row.max_items_per_run), enabled: Boolean(row.enabled), etag: row.etag ? String(row.etag) : null, lastModified: row.last_modified ? String(row.last_modified) : null, lastCollectedAt: row.last_collected_at ? String(row.last_collected_at) : null, nextCollectionAt: String(row.next_collection_at), failureCount: Number(row.failure_count), status: row.status as Source["status"], createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}
export function contentFromRow(row: Row): ContentItem {
  return { id: String(row.id), sourceId: String(row.source_id), externalUid: row.external_uid ? String(row.external_uid) : null, rawUrl: String(row.raw_url), canonicalUrl: String(row.canonical_url), canonicalUrlHash: String(row.canonical_url_hash), title: String(row.title), subtitle: row.subtitle ? String(row.subtitle) : null, imageUrl: row.image_url ? String(row.image_url) : null, author: row.author ? String(row.author) : null, publishedAt: row.published_at ? String(row.published_at) : null, firstSeenAt: String(row.first_seen_at), lastSeenAt: String(row.last_seen_at), contentHash: String(row.content_hash), status: row.status as ContentItem["status"] };
}
export function runFromRow(row: Row): CollectionRun {
  return { id: String(row.id), sourceId: String(row.source_id), startedAt: String(row.started_at), completedAt: row.completed_at ? String(row.completed_at) : null, status: row.status as CollectionRun["status"], fetchedCount: Number(row.fetched_count), insertedCount: Number(row.inserted_count), updatedCount: Number(row.updated_count), duplicateCount: Number(row.duplicate_count), errorCount: Number(row.error_count), errorMessage: row.error_message ? String(row.error_message) : null };
}
