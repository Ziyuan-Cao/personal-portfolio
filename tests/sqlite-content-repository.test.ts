import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/database.js";

test("database upsert updates content while preserving first-seen time", () => {
  const database = openDatabase(":memory:");
  const firstSeen = "2026-08-01T00:00:00.000Z";
  const base = {
    uid: "uid-1",
    canonicalUrl: "https://example.com/article",
    sourceUrl: "https://example.com/feed",
    title: "Old title",
    subtitle: null,
    imageUrl: null,
    publishedAt: null,
    seenAt: firstSeen,
  };
  assert.equal(database.upsert(base), true);
  assert.equal(database.upsert({ ...base, title: "New title", seenAt: "2026-08-02T00:00:00.000Z" }), false);
  const [stored] = database.list({ sort: "newest", limit: 10 }).items;
  assert.equal(stored?.title, "New title");
  assert.equal(stored?.firstSeenAt, firstSeen);
  assert.equal(stored?.lastSeenAt, "2026-08-02T00:00:00.000Z");
  database.close();
});
