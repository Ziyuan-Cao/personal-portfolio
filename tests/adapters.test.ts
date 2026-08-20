import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseFeed, parseHtml } from "../src/parser.js";

const fixture = (name: string) => fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", name), "utf8");

for (const [name, filename, contentType, title] of [
  ["RSS", "rss.xml", "application/rss+xml", "First & best"],
  ["Atom", "atom.xml", "application/atom+xml", "Atom entry"],
  ["JSON Feed", "json-feed.json", "application/feed+json", "JSON entry"],
] as const) {
  test(`parses ${name}`, () => {
    const items = parseFeed(fixture(filename), "https://example.com/feed", contentType);
    assert.equal(items?.length, 1);
    assert.equal(items?.[0]?.title, title);
    assert.ok(items?.[0]?.url.startsWith("https://example.com/"));
  });
}

test("extracts a generic HTML listing", () => {
  const items = parseHtml(fixture("listing.html"), "https://example.com/news");
  assert.equal(items.length, 1);
  assert.equal(items[0]?.url, "https://example.com/posts/4");
  assert.equal(items[0]?.title, "HTML entry");
});
