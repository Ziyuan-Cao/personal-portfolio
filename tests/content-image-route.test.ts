import test from "node:test";
import assert from "node:assert/strict";
import { imageDimensions } from "../src/collector.js";

test("reads PNG dimensions before accepting preview images", () => {
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47], 0);
  png.set([0x00, 0x00, 0x02, 0x80], 16);
  png.set([0x00, 0x00, 0x01, 0x68], 20);
  assert.deepEqual(imageDimensions(png), { width: 640, height: 360 });
});

test("rejects unknown image bytes", () => {
  assert.equal(imageDimensions(new Uint8Array([1, 2, 3, 4])), null);
});
