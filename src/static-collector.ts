import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectSources } from "./collector.js";
import { openDatabase } from "./database.js";
import { loadSources } from "./utils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = path.join(root, "config", "sources.txt");
const informationRoot = path.join(root, "public", "content", "information");
const indexPath = path.join(informationRoot, "index.json");
const itemsPath = path.join(informationRoot, "items");
const stagingItemsPath = path.join(informationRoot, ".items-next");
const database = openDatabase(":memory:");

async function writeJson(filename: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

try {
  const sources = loadSources(sourcesPath);
  const collection = await collectSources(sources, database);
  const items = [];
  let cursor: string | undefined;

  do {
    const page = database.list({ sort: "newest", cursor, limit: 50 });
    items.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  if (!items.length && collection.errors) {
    throw new Error(`Collection failed for all ${collection.errors} source(s); the existing Pages deployment was left unchanged.`);
  }

  const sourceOptions = database.list({ sort: "newest", limit: 1 }).sources;
  await fs.rm(stagingItemsPath, { recursive: true, force: true });
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
  };

  await fs.rm(itemsPath, { recursive: true, force: true });
  await fs.rename(stagingItemsPath, itemsPath);
  await writeJson(indexPath, document);
  await fs.rm(path.join(informationRoot, "items.json"), { force: true });
  console.log(`Wrote ${items.length} item folder(s) from ${sourceOptions.length} source(s) to ${informationRoot}`);
} finally {
  database.close();
}
