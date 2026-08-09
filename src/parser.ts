import { load } from "cheerio";
import { XMLParser } from "fast-xml-parser";

export interface RawInformationItem {
  externalUid: string | null;
  url: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  removeNSPrefix: false,
});

const asArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];

function text(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return text((value as Record<string, unknown>)["#text"]);
  return null;
}

function link(value: unknown): string | null {
  for (const entry of asArray(value)) {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") {
      const candidate = entry as Record<string, unknown>;
      if ((!candidate.rel || candidate.rel === "alternate") && candidate.href) return String(candidate.href);
    }
  }
  return null;
}

function image(entry: Record<string, unknown>): string | null {
  for (const key of ["media:content", "media:thumbnail", "enclosure", "image"]) {
    const value = asArray(entry[key])[0];
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const candidate = value as Record<string, unknown>;
      if (candidate.url) return String(candidate.url);
      if (candidate.href) return String(candidate.href);
    }
  }
  return null;
}

export function parseFeed(body: string, baseUrl: string, contentType = ""): RawInformationItem[] | null {
  try {
    if (contentType.includes("json") || /^\s*\{/.test(body)) {
      const feed = JSON.parse(body) as Record<string, unknown>;
      const entries = asArray(feed.items as Record<string, unknown>[] | undefined);
      if (!entries.length) return null;
      return entries.map((entry) => ({
        externalUid: text(entry.id),
        url: resolve(text(entry.url) ?? text(entry.external_url), baseUrl) ?? "",
        title: text(entry.title) ?? "",
        subtitle: text(entry.summary) ?? text(entry.content_text) ?? text(entry.content_html),
        imageUrl: resolve(text(entry.image) ?? text(entry.banner_image), baseUrl),
        publishedAt: normalizeDate(text(entry.date_published) ?? text(entry.date_modified)),
      })).filter(valid);
    }

    if (!/^\s*</.test(body)) return null;
    const parsed = xmlParser.parse(body) as Record<string, unknown>;
    const rss = (parsed.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
    const atom = parsed.feed as Record<string, unknown> | undefined;
    const entries = rss
      ? asArray(rss.item as Record<string, unknown>[] | undefined)
      : asArray(atom?.entry as Record<string, unknown>[] | undefined);
    if (!entries.length) return null;
    return entries.map((entry) => ({
      externalUid: text(entry.guid) ?? text(entry.id),
      url: resolve(link(entry.link) ?? text(entry.url), baseUrl) ?? "",
      title: text(entry.title) ?? "",
      subtitle: text(entry.description) ?? text(entry.summary) ?? text(entry.content),
      imageUrl: resolve(image(entry), baseUrl),
      publishedAt: normalizeDate(
        text(entry.pubDate) ?? text(entry.published) ?? text(entry["dc:date"]) ?? text(entry.date) ?? text(entry.updated),
      ),
    })).filter(valid);
  } catch {
    return null;
  }
}

export function discoverFeed(body: string, baseUrl: string): string | null {
  const $ = load(body);
  const href = $("link[rel~='alternate'][type='application/rss+xml'], link[rel~='alternate'][type='application/atom+xml'], link[rel~='alternate'][type='application/feed+json']")
    .first().attr("href");
  return resolve(href ?? null, baseUrl);
}

export function parseHtml(body: string, baseUrl: string): RawInformationItem[] {
  const $ = load(body);
  const base = new URL(baseUrl);
  if (base.hostname === "cvpr.thecvf.com" && /\/News\/?$/i.test(base.pathname)) {
    const items: RawInformationItem[] = [];
    const urls = new Set<string>();
    $("a[href]").each((_, element) => {
      const anchor = $(element);
      const itemUrl = resolve(anchor.attr("href"), baseUrl);
      if (!itemUrl) return;
      const url = new URL(itemUrl);
      if (!/^\/Conferences\/\d{4}\/News\/[^/]+\/?$/i.test(url.pathname) || urls.has(itemUrl)) return;
      const title = cleanText(anchor.text(), 300);
      if (!title) return;
      urls.add(itemUrl);
      items.push({ externalUid: null, url: itemUrl, title, subtitle: null, imageUrl: null, publishedAt: null });
    });
    return items;
  }

  const nodes = $("article, .news-card, .post-card, .blog-card, .post, .entry").toArray();
  if (!nodes.length) {
    $("h2, h3").each((_, heading) => {
      const container = $(heading).closest("li, div").get(0);
      if (container?.type === "tag") nodes.push(container);
    });
  }

  const items: RawInformationItem[] = [];
  const urls = new Set<string>();
  for (const element of nodes) {
    const node = $(element);
    const heading = node.find("h1, h2, h3, [class*='title']").first();
    const anchor = heading.closest("a[href]").length
      ? heading.closest("a[href]").first()
      : node.find("a[href]").first();
    const itemUrl = resolve(anchor.attr("href") ?? null, baseUrl);
    const title = cleanText(heading.text() || anchor.text(), 300);
    if (!itemUrl || !title || urls.has(itemUrl)) continue;
    urls.add(itemUrl);

    const imageNode = node.find("img").first();
    const sourceSet = imageNode.attr("srcset")?.split(",")[0]?.trim().split(/\s+/)[0];
    const subtitle = cleanText(node.find("p, [class*='summary'], [class*='description'], [class*='excerpt']").first().text(), 1000);
    const time = node.find("time").first();
    items.push({
      externalUid: null,
      url: itemUrl,
      title,
      subtitle,
      imageUrl: resolve(imageNode.attr("src") ?? imageNode.attr("data-src") ?? sourceSet ?? null, baseUrl),
      publishedAt: normalizeDate(time.attr("datetime") ?? time.text()),
    });
  }

  return items;
}

/**
 * Returns image URLs that are actually referenced by an article page, ordered
 * from the strongest main-image signal to the weakest. Pixel dimensions are
 * deliberately checked by the collector after downloading each candidate.
 */
export function pageImageCandidates(body: string, baseUrl: string): string[] {
  const $ = load(body);
  const candidates: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | null | undefined) => {
    const url = resolve(value, baseUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    candidates.push(url);
  };

  $("meta[property='og:image'], meta[property='og:image:secure_url'], meta[name='twitter:image'], meta[name='twitter:image:src']")
    .each((_, node) => add($(node).attr("content")));
  $("link[rel='image_src']").each((_, node) => add($(node).attr("href")));

  $("article img, main img, [role='main'] img").each((_, node) => {
    const image = $(node);
    const identity = `${image.attr("class") ?? ""} ${image.attr("id") ?? ""} ${image.attr("alt") ?? ""}`;
    if (/\b(?:avatar|badge|emoji|icon|logo|spinner)\b/i.test(identity)) return;

    const sourceSets = [image.attr("srcset"), image.attr("data-srcset")];
    for (const sourceSet of sourceSets) {
      if (!sourceSet) continue;
      const sources = sourceSet.split(",").map((entry) => {
        const [url = "", descriptor = ""] = entry.trim().split(/\s+/);
        return { url, width: Number.parseInt(descriptor, 10) || 0 };
      }).sort((left, right) => right.width - left.width);
      for (const source of sources) add(source.url);
    }
    add(image.attr("data-src"));
    add(image.attr("data-lazy-src"));
    add(image.attr("src"));
  });

  return candidates;
}

/** Extracts an article's publication time from structured page data. */
export function pagePublishedDate(body: string, pageUrl: string): string | null {
  const $ = load(body);
  const candidates: Array<string | null | undefined> = [];

  const metaSelectors = [
    "meta[property='article:published_time']",
    "meta[property='og:published_time']",
    "meta[itemprop='datePublished']",
    "meta[name='date']",
    "meta[name='publish-date']",
    "meta[name='pubdate']",
    "meta[name='parsely-pub-date']",
    "meta[name='dc.date']",
    "meta[name='dc.date.issued']",
    "meta[property='article:modified_time']",
    "meta[itemprop='dateModified']",
  ];
  for (const selector of metaSelectors) candidates.push($(selector).first().attr("content"));

  $("script[type='application/ld+json']").each((_, script) => {
    const value = $(script).text().trim();
    if (!value) return;
    try {
      collectStructuredDates(JSON.parse(value), candidates);
    } catch {
      // Some pages contain malformed or non-JSON data in JSON-LD blocks.
    }
  });

  candidates.push(
    $("article time[datetime], main time[datetime], time[datetime]").first().attr("datetime"),
    $("article time, main time, time").first().text(),
    $(".published, .post-date, .entry-date, .article-date, [class*='publish-date'], [class*='published-date']").first().text(),
  );

  for (const candidate of candidates) {
    const date = normalizeDate(candidate);
    if (date) return date;
  }

  const visibleText = ($("article, main").first().text() || $("body").text()).replace(/\s+/g, " ");
  const writtenDate = /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}|\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2})\b/i.exec(visibleText)?.[0];
  const visibleDate = normalizeDate(writtenDate ? `${writtenDate} UTC` : null);
  if (visibleDate) return visibleDate;

  const pathDate = /\/(20\d{2})\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])(?:\/|$)/.exec(new URL(pageUrl).pathname);
  if (pathDate) return normalizeDate(`${pathDate[1]}-${pathDate[2]!.padStart(2, "0")}-${pathDate[3]!.padStart(2, "0")}T00:00:00Z`);
  return null;
}

function collectStructuredDates(value: unknown, output: Array<string | null | undefined>): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectStructuredDates(entry, output);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  for (const key of ["datePublished", "dateCreated", "uploadDate", "dateModified"]) {
    if (typeof record[key] === "string") output.push(record[key] as string);
  }
  if (record["@graph"]) collectStructuredDates(record["@graph"], output);
}

export function normalizeItems(items: RawInformationItem[], baseUrl: string, limit = 30): RawInformationItem[] {
  const normalized: RawInformationItem[] = [];
  for (const item of items) {
    const url = resolve(item.url, baseUrl);
    const title = cleanText(item.title, 300);
    if (!url || !title) continue;
    normalized.push({
      externalUid: cleanText(item.externalUid, 500),
      url,
      title,
      subtitle: cleanText(item.subtitle, 1000),
      imageUrl: resolve(item.imageUrl, baseUrl),
      publishedAt: normalizeDate(item.publishedAt),
    });
    if (normalized.length >= limit) break;
  }
  return normalized;
}

function cleanText(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  const clean = load(`<body>${value}</body>`)("body").text().replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1).trimEnd()}…` : clean;
}

function resolve(value: string | null | undefined, baseUrl: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function valid(item: RawInformationItem): boolean {
  return Boolean(item.url && item.title);
}
