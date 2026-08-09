import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { openDatabase } from "../src/infrastructure/database.js";
import { SqliteSourceRepository } from "../src/adapters/outbound/persistence/SqliteSourceRepository.js";
import { SqliteContentRepository } from "../src/adapters/outbound/persistence/SqliteContentRepository.js";
import { ListContentUseCase } from "../src/application/use-cases/ListContentUseCase.js";
import { contentRoutes } from "../src/adapters/inbound/http/content-routes.js";
import type { BinaryFetchResponse, FetchResponse, HttpFetcher } from "../src/ports/HttpFetcher.js";
import type { Source } from "../src/domain/entities/Source.js";
import type { ContentItem } from "../src/domain/entities/ContentItem.js";

class ImageHttpFetcher implements HttpFetcher {
  async get(): Promise<FetchResponse> { throw new Error("Text fetching is not used by this test"); }
  async getBinary(): Promise<BinaryFetchResponse> {
    return { status: 200, url: "https://cdn.example.com/image.png", contentType: "image/png", body: new Uint8Array([137, 80, 78, 71]), etag: null, lastModified: null, notModified: false };
  }
}

test("content images are served through the backend image route", async () => {
  const database = openDatabase(":memory:");
  const sources = new SqliteSourceRepository(database);
  const content = new SqliteContentRepository(database);
  const now = "2026-08-08T00:00:00.000Z";
  const source: Source = { id: "source", name: "Example", baseUrl: "https://example.com/", collectionUrl: "https://example.com/feed", feedUrl: null, adapterType: "FEED", adapterConfig: {}, intervalMinutes: 60, maxItemsPerRun: 30, enabled: true, etag: null, lastModified: null, lastCollectedAt: null, nextCollectionAt: now, failureCount: 0, status: "ACTIVE", createdAt: now, updatedAt: now };
  const item: ContentItem = { id: "content", sourceId: source.id, externalUid: "article-1", rawUrl: "https://example.com/article", canonicalUrl: "https://example.com/article", canonicalUrlHash: "hash", title: "Article", subtitle: "Summary", imageUrl: "https://cdn.example.com/image.png", author: null, publishedAt: now, firstSeenAt: now, lastSeenAt: now, contentHash: "content-hash", status: "ACTIVE" };
  await sources.create(source);
  await content.upsert(item);

  const app = Fastify();
  await contentRoutes(app, { content, list: new ListContentUseCase(content), http: new ImageHttpFetcher() });
  const metadata = await app.inject({ method: "GET", url: "/api/content/content" });
  assert.equal(metadata.json().imageUrl, "/api/content/content/image");
  const image = await app.inject({ method: "GET", url: "/api/content/content/image" });
  assert.equal(image.statusCode, 200);
  assert.equal(image.headers["content-type"], "image/png");
  assert.deepEqual(image.rawPayload, Buffer.from([137, 80, 78, 71]));

  await app.close();
  database.close();
});
