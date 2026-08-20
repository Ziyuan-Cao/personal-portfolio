import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import { openDatabase } from "../src/database.js";

test("content API returns collected items and source metadata", async () => {
  const database = openDatabase(":memory:");
  database.upsert({
    uid: "uid-1",
    canonicalUrl: "https://example.com/article",
    sourceUrl: "https://example.com/feed",
    title: "Article",
    subtitle: "Summary",
    imageUrl: null,
    publishedAt: "2026-08-01T00:00:00.000Z",
    seenAt: "2026-08-02T00:00:00.000Z",
  });

  const { app } = await buildServer(database);
  const response = await app.inject({ method: "GET", url: "/api/content?limit=12&sort=newest" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().items.length, 1);
  assert.equal(response.json().items[0].title, "Article");
  assert.deepEqual(response.json().sources, [{ url: "https://example.com/feed", name: "Example" }]);
  await app.close();
});
