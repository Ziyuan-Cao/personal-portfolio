export const ADAPTER_TYPES = ["AUTO", "FEED", "HTML", "CUSTOM", "BROWSER"] as const;
export type AdapterType = (typeof ADAPTER_TYPES)[number];
export type SourceStatus = "ACTIVE" | "PAUSED" | "FAILING";

export interface HtmlAdapterConfig {
  itemSelector?: string;
  linkSelector?: string;
  titleSelector?: string;
  subtitleSelector?: string;
  imageSelector?: string;
  dateSelector?: string;
  nextPageSelector?: string;
}

export interface Source {
  id: string;
  name: string;
  baseUrl: string;
  collectionUrl: string;
  feedUrl: string | null;
  adapterType: AdapterType;
  adapterConfig: HtmlAdapterConfig;
  intervalMinutes: number;
  maxItemsPerRun: number;
  enabled: boolean;
  etag: string | null;
  lastModified: string | null;
  lastCollectedAt: string | null;
  nextCollectionAt: string;
  failureCount: number;
  status: SourceStatus;
  createdAt: string;
  updatedAt: string;
}

export type NewSource = Omit<Source, "id" | "etag" | "lastModified" | "lastCollectedAt" | "nextCollectionAt" | "failureCount" | "status" | "createdAt" | "updatedAt">;

export function assertWebUrl(value: string, field = "URL"): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${field} must be a valid URL`); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(`${field} must use HTTP or HTTPS`);
  return url.toString();
}

export function validateSource(input: NewSource): NewSource {
  const name = input.name.trim();
  if (!name || name.length > 120) throw new Error("Source name must contain 1 to 120 characters");
  if (!ADAPTER_TYPES.includes(input.adapterType)) throw new Error("Unknown collection mode");
  if (input.adapterType === "BROWSER") throw new Error("Browser collection is not available in this MVP");
  if (input.adapterType === "CUSTOM") throw new Error("No custom adapters are registered");
  if (!Number.isInteger(input.intervalMinutes) || input.intervalMinutes < 15 || input.intervalMinutes > 10080) throw new Error("Collection interval must be between 15 and 10080 minutes");
  if (!Number.isInteger(input.maxItemsPerRun) || input.maxItemsPerRun < 1 || input.maxItemsPerRun > 200) throw new Error("Maximum items per run must be between 1 and 200");
  return {
    ...input,
    name,
    baseUrl: assertWebUrl(input.baseUrl, "Website URL"),
    collectionUrl: assertWebUrl(input.collectionUrl, "Collection URL"),
    feedUrl: input.feedUrl ? assertWebUrl(input.feedUrl, "Feed URL") : null,
    adapterConfig: input.adapterConfig ?? {},
  };
}
