import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectSources } from "./collector.js";
import { openDatabase } from "./database.js";
import { loadSources } from "./utils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = path.join(root, "config", "sources.txt");
const outputPath = path.join(root, "public", "content", "information", "items.json");
const database = openDatabase(":memory:");

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
  const document = {
    generatedAt: new Date().toISOString(),
    items,
    sources: sourceOptions,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  console.log(`Wrote ${items.length} item(s) from ${sourceOptions.length} source(s) to ${outputPath}`);
} finally {
  database.close();
}
