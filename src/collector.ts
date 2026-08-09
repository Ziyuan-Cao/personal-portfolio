import dns from "node:dns/promises";
import net from "node:net";
import type { InformationDatabase } from "./database.js";
import { discoverFeed, normalizeItems, pageImageCandidates, parseFeed, parseHtml, type RawInformationItem } from "./parser.js";
import { canonicalizeUrl, sourceName, stableUid } from "./utils.js";

interface FetchResult {
  body: string;
  contentType: string;
  url: string;
}

interface BinaryFetchResult {
  body: Uint8Array;
  contentType: string;
  url: string;
}

interface RefreshResult {
  found: number;
  inserted: number;
  errors: number;
}

const timeoutMs = positiveInteger(process.env.HTTP_TIMEOUT_MS, 10_000);
const maxBytes = positiveInteger(process.env.HTTP_MAX_BYTES, 5_242_880);
const maxItems = positiveInteger(process.env.MAX_ITEMS_PER_SOURCE, 30);
const minPreviewImageWidth = positiveInteger(process.env.MIN_PREVIEW_IMAGE_WIDTH, 480);
const enrichmentConcurrency = positiveInteger(process.env.ENRICHMENT_CONCURRENCY, 4);
const userAgent = process.env.HTTP_USER_AGENT ?? "PersonalPortfolioNewsCollector/3.0";

class HttpStatusError extends Error {
  constructor(readonly status: number, readonly url: string) {
    super(`HTTP ${status}`);
  }
}

export async function collectSources(sources: string[], database: InformationDatabase): Promise<RefreshResult> {
  const result: RefreshResult = { found: 0, inserted: 0, errors: 0 };
  for (const sourceUrl of sources) {
    const label = sourceName(sourceUrl);
    try {
      const items = await collectSource(sourceUrl);
      const seenAt = new Date().toISOString();
      const inserted = database.transaction(() => {
        let count = 0;
        for (const item of items) {
          const canonicalUrl = canonicalizeUrl(item.url, sourceUrl);
          if (database.upsert({
            uid: stableUid(sourceUrl, item.externalUid, canonicalUrl),
            canonicalUrl,
            sourceUrl,
            title: item.title,
            subtitle: item.subtitle,
            imageUrl: item.imageUrl,
            publishedAt: item.publishedAt,
            seenAt,
          })) count++;
        }
        return count;
      });
      result.found += items.length;
      result.inserted += inserted;
      console.log(`[${label}] found=${items.length} new=${inserted}`);
    } catch (error) {
      result.errors++;
      console.error(`[${label}] ERROR ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}

export async function collectSource(sourceUrl: string) {
  const page = await fetchText(sourceUrl);
  let items = parseFeed(page.body, page.url, page.contentType);
  if (!items) {
    const feedUrl = discoverFeed(page.body, page.url);
    if (feedUrl) {
      try {
        const feed = await fetchText(feedUrl);
        items = parseFeed(feed.body, feed.url, feed.contentType);
      } catch {
        // The source page can still be parsed as HTML when its advertised feed fails.
      }
    }
  }
  const normalized = normalizeItems(items ?? parseHtml(page.body, page.url), page.url, maxItems);
  const checked = await mapConcurrent(normalized, enrichmentConcurrency, checkArticle);
  return checked.filter((item): item is RawInformationItem => item !== null);
}

async function checkArticle(item: RawInformationItem): Promise<RawInformationItem | null> {
  try {
    const page = await fetchText(item.url);
    if (looksLikeNotFound(page.body, page.contentType)) {
      console.warn(`[article] Dropped soft 404: ${item.url}`);
      return null;
    }
    const imageUrl = page.contentType.includes("html")
      ? await findHighResolutionPageImage(page.body, page.url)
      : null;
    return { ...item, url: page.url, imageUrl };
  } catch (error) {
    if (error instanceof HttpStatusError && (error.status === 404 || error.status === 410)) {
      console.warn(`[article] Dropped HTTP ${error.status}: ${item.url}`);
      return null;
    }
    console.warn(`[article] Could not verify ${item.url}: ${error instanceof Error ? error.message : String(error)}`);
    return { ...item, imageUrl: null };
  }
}

async function findHighResolutionPageImage(body: string, pageUrl: string): Promise<string | null> {
  for (const candidate of pageImageCandidates(body, pageUrl).slice(0, 12)) {
    try {
      const image = await fetchBinary(candidate);
      if (!image.contentType.startsWith("image/")) continue;
      const dimensions = imageDimensions(image.body);
      if (dimensions && dimensions.width > minPreviewImageWidth) return image.url;
    } catch {
      // Invalid, inaccessible, and undersized candidates are intentionally ignored.
    }
  }
  return null;
}

function looksLikeNotFound(body: string, contentType: string): boolean {
  if (!contentType.includes("html")) return false;
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(body)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(body)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
  return /^(?:404\b|410\b|page not found\b|not found\b|page unavailable\b)/i.test(title)
    || /^(?:404\b|410\b|page not found\b|not found\b|page unavailable\b)/i.test(heading);
}

async function fetchText(rawUrl: string): Promise<FetchResult> {
  const response = await fetchBytes(rawUrl, "application/rss+xml, application/atom+xml, application/feed+json, application/json, text/html, application/xml, text/xml;q=0.9", maxBytes);
  return { ...response, body: new TextDecoder().decode(response.body) };
}

async function fetchBinary(rawUrl: string): Promise<BinaryFetchResult> {
  return fetchBytes(rawUrl, "image/avif, image/webp, image/png, image/jpeg, image/gif;q=0.8", maxBytes);
}

async function fetchBytes(rawUrl: string, accept: string, byteLimit: number): Promise<BinaryFetchResult> {
  let current = rawUrl;
  for (let redirects = 0; redirects <= 5; redirects++) {
    const url = await validateTarget(current);
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetch(url, {
          headers: {
            accept,
            "user-agent": userAgent,
          },
          redirect: "manual",
          signal: controller.signal,
        });
      } catch (error) {
        if (attempt === 2) throw error;
        await delay(250 * 2 ** attempt);
        continue;
      } finally {
        clearTimeout(timer);
      }
      if (![429, 502, 503, 504].includes(response.status) || attempt === 2) break;
      await delay(250 * 2 ** attempt);
    }
    if (!response) throw new Error("HTTP request failed");
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect did not include a location");
      current = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) throw new HttpStatusError(response.status, url.toString());

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > byteLimit) throw new Error("Response is too large");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response did not contain a body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > byteLimit) {
        await reader.cancel();
        throw new Error("Response is too large");
      }
      chunks.push(value);
    }
    return {
      body: new Uint8Array(Buffer.concat(chunks)),
      contentType: (response.headers.get("content-type") ?? "").split(";", 1)[0]!.trim().toLowerCase(),
      url: url.toString(),
    };
  }
  throw new Error("Too many redirects");
}

export function imageDimensions(data: Uint8Array): { width: number; height: number } | null {
  if (data.length >= 24 && data[0] === 0x89 && String.fromCharCode(...data.slice(1, 4)) === "PNG") {
    return { width: readUint32(data, 16), height: readUint32(data, 20) };
  }
  if (data.length >= 10 && String.fromCharCode(...data.slice(0, 3)) === "GIF") {
    return { width: data[6]! | data[7]! << 8, height: data[8]! | data[9]! << 8 };
  }
  if (data.length >= 30 && String.fromCharCode(...data.slice(0, 4)) === "RIFF" && String.fromCharCode(...data.slice(8, 12)) === "WEBP") {
    const kind = String.fromCharCode(...data.slice(12, 16));
    if (kind === "VP8X") return { width: 1 + readUint24Little(data, 24), height: 1 + readUint24Little(data, 27) };
    if (kind === "VP8L" && data[20] === 0x2f) {
      return {
        width: 1 + (data[21]! | (data[22]! & 0x3f) << 8),
        height: 1 + ((data[22]! >> 6) | data[23]! << 2 | (data[24]! & 0x0f) << 10),
      };
    }
    if (kind === "VP8 " && data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a) {
      return { width: (data[26]! | data[27]! << 8) & 0x3fff, height: (data[28]! | data[29]! << 8) & 0x3fff };
    }
  }
  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 8 < data.length) {
      if (data[offset] !== 0xff) { offset++; continue; }
      while (data[offset] === 0xff) offset++;
      const marker = data[offset++]!;
      if (marker === 0xd9 || marker === 0xda || offset + 1 >= data.length) break;
      const length = data[offset]! << 8 | data[offset + 1]!;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: data[offset + 3]! << 8 | data[offset + 4]!, width: data[offset + 5]! << 8 | data[offset + 6]! };
      }
      if (length < 2) break;
      offset += length;
    }
  }

  const ispe = findAscii(data, "ispe");
  if (ispe >= 0 && ispe + 12 <= data.length) {
    return { width: readUint32(data, ispe + 4), height: readUint32(data, ispe + 8) };
  }
  return null;
}

function readUint32(data: Uint8Array, offset: number): number {
  return data[offset]! * 0x1000000 + (data[offset + 1]! << 16 | data[offset + 2]! << 8 | data[offset + 3]!);
}

function readUint24Little(data: Uint8Array, offset: number): number {
  return data[offset]! | data[offset + 1]! << 8 | data[offset + 2]! << 16;
}

function findAscii(data: Uint8Array, value: string): number {
  const bytes = [...value].map((character) => character.charCodeAt(0));
  outer: for (let index = 0; index <= data.length - bytes.length; index++) {
    for (let byte = 0; byte < bytes.length; byte++) if (data[index + byte] !== bytes[byte]) continue outer;
    return index;
  }
  return -1;
}

async function mapConcurrent<T, U>(values: T[], concurrency: number, operation: (value: T) => Promise<U>): Promise<U[]> {
  const results = new Array<U>(values.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await operation(values[index]!);
    }
  });
  await Promise.all(workers);
  return results;
}

async function validateTarget(value: string): Promise<URL> {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only HTTP and HTTPS sources are allowed");
  if (url.username || url.password) throw new Error("Source URLs cannot contain credentials");
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Local network sources are not allowed");
  }
  const addresses = net.isIP(hostname) ? [{ address: hostname }] : await dns.lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Private, loopback, and link-local sources are not allowed");
  }
  return url;
}

function isPrivateIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const [first = 0, second = 0] = address.split(".").map(Number);
    return first === 10 || first === 127 || first === 0 || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
      || (first === 100 && second >= 64 && second <= 127) || first >= 224;
  }
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd")
    || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea")
    || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.")
    || normalized.startsWith("::ffff:192.168.");
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
