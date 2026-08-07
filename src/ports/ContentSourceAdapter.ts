import type { Source } from "../domain/entities/Source.js";

export interface RawContentItem {
  externalUid?: string | null;
  url: string;
  canonicalUrl?: string | null;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  extraction?: Record<string, string>;
}

export interface CollectionContext { signal?: AbortSignal; maxItems: number; captureValidators?: (validators:{etag:string|null;lastModified:string|null})=>void; }
export interface ContentSourceAdapter {
  readonly name: string;
  supports(source: Source): boolean;
  collect(source: Source, context: CollectionContext): Promise<RawContentItem[]>;
}
