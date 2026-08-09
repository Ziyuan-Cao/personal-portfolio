import test from "node:test";
import assert from "node:assert/strict";
import { toContentItemDto } from "../src/application/dto/ContentItemDto.js";

test("content DTO exposes a backend image URL instead of the remote image URL", () => {
  const item = {
    id: "content/id",
    sourceId: "source",
    externalUid: null,
    rawUrl: "https://example.com/article",
    canonicalUrl: "https://example.com/article",
    canonicalUrlHash: "hash",
    title: "Article",
    subtitle: "Summary",
    imageUrl: "https://cdn.example.com/image.jpg",
    author: null,
    publishedAt: null,
    firstSeenAt: "2026-08-08T00:00:00.000Z",
    lastSeenAt: "2026-08-08T00:00:00.000Z",
    contentHash: "content-hash",
    status: "ACTIVE" as const,
    sourceName: "Example",
  };

  assert.equal(toContentItemDto(item).imageUrl, "/api/content/content%2Fid/image");
});
