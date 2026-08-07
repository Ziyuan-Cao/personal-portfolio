export interface FetchOptions { etag?: string | null; lastModified?: string | null; acceptedContentTypes?: string[]; signal?: AbortSignal; }
export interface FetchResponse { status: number; url: string; contentType: string; body: string; etag: string | null; lastModified: string | null; notModified: boolean; }
export interface HttpFetcher { get(url: string, options?: FetchOptions): Promise<FetchResponse>; }
