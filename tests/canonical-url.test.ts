import test from "node:test";
import assert from "node:assert/strict";
import { canonicalizeUrl, stableUid } from "../src/utils.js";

test("canonical URL removes fragments, default ports, and tracking parameters", () => {
  assert.equal(
    canonicalizeUrl("HTTPS://Example.COM:443/posts/?utm_source=email&b=2&a=1#section"),
    "https://example.com/posts?a=1&b=2",
  );
});

test("stable UID is repeatable and source-aware when an external ID exists", () => {
  const first = stableUid("https://example.com/feed", "article-1", "https://example.com/article");
  const second = stableUid("https://example.com/feed", "article-1", "https://example.com/changed");
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});
