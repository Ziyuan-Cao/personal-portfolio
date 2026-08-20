import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectSources, type RefreshResult } from "./collector.js";
import { openDatabase } from "./database.js";
import { loadSources, sourceName } from "./utils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = path.join(root, "config", "sources.txt");
const informationRoot = path.join(root, "public", "content", "information");
const stagingItemsPath = path.join(informationRoot, ".items-next");
const stagingIndexPath = path.join(informationRoot, ".index-next.json");

export interface StaticInformationItem {
  id: string;
  uid: string;
  url: string;
  canonicalUrl: string;
  sourceUrl: string;
  sourceName: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface StaticManifest {
  items?: string[];
}

async function writeJson(filename: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function pathExists(filename: string): Promise<boolean> {
  return fs.access(filename).then(() => true, () => false);
}

export async function readExistingItems(snapshotRoot = informationRoot): Promise<StaticInformationItem[]> {
  const resolvedRoot = path.resolve(snapshotRoot);
  const manifestPath = path.join(resolvedRoot, "index.json");
  if (!await pathExists(manifestPath)) return [];
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as StaticManifest;
  if (!Array.isArray(manifest.items)) throw new Error("The existing news index has an invalid items list");
  return Promise.all(manifest.items.map(async (relativePath) => {
    const filename = path.resolve(resolvedRoot, relativePath);
    if (!filename.startsWith(`${resolvedRoot}${path.sep}`)) {
      throw new Error(`Existing news path escapes its root: ${relativePath}`);
    }
    return JSON.parse(await fs.readFile(filename, "utf8")) as StaticInformationItem;
  }));
}

function sameContent(left: StaticInformationItem, right: StaticInformationItem): boolean {
  return left.canonicalUrl === right.canonicalUrl
    && left.sourceUrl === right.sourceUrl
    && left.title === right.title
    && left.subtitle === right.subtitle
    && left.imageUrl === right.imageUrl
    && left.publishedAt === right.publishedAt;
}

export function mergeStaticItems(
  current: StaticInformationItem[],
  previous: StaticInformationItem[],
  collection: Pick<RefreshResult, "sources">,
): StaticInformationItem[] {
  const previousByUid = new Map(previous.map((item) => [item.uid, item]));
  const previousByCanonicalUrl = new Map(previous.map((item) => [item.canonicalUrl, item]));
  const merged = current.map((item) => {
    const existing = previousByUid.get(item.uid) ?? previousByCanonicalUrl.get(item.canonicalUrl);
    if (!existing) return item;
    return {
      ...item,
      id: existing.id,
      firstSeenAt: existing.firstSeenAt,
      lastSeenAt: sameContent(item, existing) ? existing.lastSeenAt : item.lastSeenAt,
    };
  });

  const currentUids = new Set(merged.map((item) => item.uid));
  const failedSources = new Set(
    collection.sources.filter((source) => source.status === "failed").map((source) => source.url),
  );
  for (const item of previous) {
    if (failedSources.has(item.sourceUrl) && !currentUids.has(item.uid)) merged.push(item);
  }

  return merged.sort((left, right) => {
    const leftTime = Date.parse(left.publishedAt ?? left.firstSeenAt);
    const rightTime = Date.parse(right.publishedAt ?? right.firstSeenAt);
    return rightTime - leftTime || left.uid.localeCompare(right.uid);
  });
}

async function replaceSnapshot(snapshotRoot: string, nextItemsPath: string, nextIndexPath: string): Promise<void> {
  const liveItems = path.join(snapshotRoot, "items");
  const liveIndex = path.join(snapshotRoot, "index.json");
  const backupItems = path.join(snapshotRoot, ".items-previous");
  const backupIndex = path.join(snapshotRoot, ".index-previous.json");
  await fs.rm(backupItems, { recursive: true, force: true });
  await fs.rm(backupIndex, { force: true });

  let itemsBackedUp = false;
  let indexBackedUp = false;
  try {
    if (await pathExists(liveItems)) {
      await fs.rename(liveItems, backupItems);
      itemsBackedUp = true;
    }
    await fs.rename(nextItemsPath, liveItems);
    if (await pathExists(liveIndex)) {
      await fs.rename(liveIndex, backupIndex);
      indexBackedUp = true;
    }
    await fs.rename(nextIndexPath, liveIndex);
  } catch (error) {
    await fs.rm(liveItems, { recursive: true, force: true });
    if (itemsBackedUp && await pathExists(backupItems)) await fs.rename(backupItems, liveItems);
    if (!await pathExists(liveIndex) && indexBackedUp && await pathExists(backupIndex)) {
      await fs.rename(backupIndex, liveIndex);
    }
    throw error;
  }
  await fs.rm(backupItems, { recursive: true, force: true });
  await fs.rm(backupIndex, { force: true });
}

export async function runStaticCollection(): Promise<void> {
  const database = openDatabase(":memory:");
  try {
    const sources = loadSources(sourcesPath);
    const previousItems = await readExistingItems();
    const collection = await collectSources(sources, database);
    const currentItems: StaticInformationItem[] = [];
    let cursor: string | undefined;

    do {
      const page = database.list({ sort: "newest", cursor, limit: 50 });
      currentItems.push(...page.items);
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    const configuredThreshold = Number.parseInt(process.env.COLLECTION_FAILURE_THRESHOLD ?? "5", 10);
    const maximumFailures = Number.isInteger(configuredThreshold) && configuredThreshold >= 0
      ? configuredThreshold
      : 5;
    if (collection.errors === sources.length || collection.errors > maximumFailures) {
      throw new Error(
        `Collection failed for ${collection.errors}/${sources.length} source(s); the existing Pages deployment was left unchanged.`,
      );
    }

    const items = mergeStaticItems(currentItems, previousItems, collection);
    const sourceOptions = sources.map((url) => ({ url, name: sourceName(url) }));
    await fs.rm(stagingItemsPath, { recursive: true, force: true });
    await fs.rm(stagingIndexPath, { force: true });
    await fs.mkdir(stagingItemsPath, { recursive: true });
    const itemFiles = await Promise.all(items.map(async (item) => {
      const itemFile = path.join(stagingItemsPath, item.uid, "item.json");
      await writeJson(itemFile, item);
      return `items/${item.uid}/item.json`;
    }));

    const document = {
      generatedAt: new Date().toISOString(),
      sources: sourceOptions,
      items: itemFiles,
      collection: {
        attempted: sources.length,
        succeeded: sources.length - collection.errors,
        failed: collection.errors,
        found: collection.found,
        inserted: collection.inserted,
        failures: collection.sources
          .filter((source) => source.status === "failed")
          .map(({ url, name, error }) => ({ url, name, error })),
      },
    };

    await writeJson(stagingIndexPath, document);
    await replaceSnapshot(informationRoot, stagingItemsPath, stagingIndexPath);
    await fs.rm(path.join(informationRoot, "items.json"), { force: true });
    console.log(
      `Wrote ${items.length} item folder(s) from ${sourceOptions.length} source(s) to ${informationRoot}; failures=${collection.errors}`,
    );
  } finally {
    database.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runStaticCollection();
}
