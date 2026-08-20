import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mergeStaticItems, readExistingItems, type StaticInformationItem } from "../src/static-collector.js";

const item = (overrides: Partial<StaticInformationItem> = {}): StaticInformationItem => ({
  id: "new-id",
  uid: "uid-1",
  url: "https://example.com/article",
  canonicalUrl: "https://example.com/article",
  sourceUrl: "https://example.com/feed",
  sourceName: "Example",
  title: "Article",
  subtitle: "Summary",
  imageUrl: null,
  publishedAt: "2026-08-01T00:00:00.000Z",
  firstSeenAt: "2026-08-20T00:00:00.000Z",
  lastSeenAt: "2026-08-20T00:00:00.000Z",
  ...overrides,
});

test("snapshot merge preserves stable metadata for unchanged items", () => {
  const previous = item({ id: "existing-id", firstSeenAt: "2026-08-01T00:00:00.000Z", lastSeenAt: "2026-08-02T00:00:00.000Z" });
  const [merged] = mergeStaticItems([item()], [previous], {
    sources: [{ url: previous.sourceUrl, name: "Example", status: "success", found: 1, inserted: 1, error: null }],
  });
  assert.equal(merged?.id, "existing-id");
  assert.equal(merged?.firstSeenAt, previous.firstSeenAt);
  assert.equal(merged?.lastSeenAt, previous.lastSeenAt);
});

test("snapshot merge retains the last good items for a failed source", () => {
  const previous = item();
  const merged = mergeStaticItems([], [previous], {
    sources: [{ url: previous.sourceUrl, name: "Example", status: "failed", found: 0, inserted: 0, error: "timeout" }],
  });
  assert.deepEqual(merged, [previous]);
});

test("snapshot merge removes stale items after a successful source refresh", () => {
  const previous = item();
  const merged = mergeStaticItems([], [previous], {
    sources: [{ url: previous.sourceUrl, name: "Example", status: "success", found: 1, inserted: 1, error: null }],
  });
  assert.deepEqual(merged, []);
});

test("existing snapshot paths cannot escape the news directory", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-news-test-"));
  try {
    await fs.writeFile(path.join(directory, "index.json"), JSON.stringify({ items: ["../outside.json"] }));
    await assert.rejects(readExistingItems(directory), /escapes its root/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
