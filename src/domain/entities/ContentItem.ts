export type ContentStatus = "ACTIVE" | "DELETED";

export interface ContentItem {
  id: string;
  sourceId: string;
  externalUid: string | null;
  rawUrl: string;
  canonicalUrl: string;
  canonicalUrlHash: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  contentHash: string;
  status: ContentStatus;
}

export function assertValidContent(item: Pick<ContentItem, "title" | "canonicalUrl">): void {
  if (!item.title.trim()) throw new Error("Content title is required");
  if (!item.canonicalUrl) throw new Error("Content URL is required");
}
