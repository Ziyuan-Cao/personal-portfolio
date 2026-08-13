import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const contentRoot = path.join(publicRoot, "content");
const requiredLocales = ["ja", "zh-CN"];
const immutableTranslationKeys = new Set([
  "slug", "id", "url", "src", "image", "cardImage", "publishedAt",
  "readingTime", "file", "language", "code", "expression", "symbol",
  "icon", "tone", "type", "kind",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(filename) {
  return JSON.parse(await fs.readFile(filename, "utf8"));
}

function localeFilename(filename, locale) {
  return filename.replace(/\.json$/, `.${locale}.json`);
}

function validateOverlay(source, overlay, label, trail = "") {
  assert(overlay !== null && typeof overlay === typeof source, `${label}${trail} has a different value type`);
  if (Array.isArray(overlay)) {
    assert(Array.isArray(source), `${label}${trail} must remain an array`);
    assert(overlay.length === source.length, `${label}${trail} must keep the source array length`);
    overlay.forEach((value, index) => validateOverlay(source[index], value, label, `${trail}[${index}]`));
    return;
  }
  if (overlay && typeof overlay === "object") {
    for (const [key, value] of Object.entries(overlay)) {
      assert(Object.hasOwn(source, key), `${label}${trail}.${key} does not exist in the English source`);
      validateOverlay(source[key], value, label, `${trail}.${key}`);
      if (immutableTranslationKeys.has(key)) {
        assert(JSON.stringify(value) === JSON.stringify(source[key]), `${label}${trail}.${key} must not be translated`);
      }
    }
    return;
  }
  if (typeof overlay === "string") {
    assert(overlay.trim().length > 0, `${label}${trail} must not be empty`);
    assert(!overlay.includes("<<<I18N_"), `${label}${trail} contains a translation batching marker`);
  }
}

async function validateTranslations(filename, source, requiredKeys, label) {
  for (const locale of requiredLocales) {
    const translatedFilename = localeFilename(filename, locale);
    const overlay = await readJson(translatedFilename);
    for (const key of requiredKeys) {
      assert(typeof overlay[key] === "string" && overlay[key].trim(), `${label} ${locale} is missing ${key}`);
    }
    validateOverlay(source, overlay, `${label} ${locale}`);
  }
}

function resolveListedFile(ownerRoot, listedPath) {
  assert(typeof listedPath === "string" && listedPath.length > 0, "Index paths must be non-empty strings");
  const resolved = path.resolve(ownerRoot, listedPath);
  assert(resolved.startsWith(`${ownerRoot}${path.sep}`), `Indexed path escapes its content root: ${listedPath}`);
  return resolved;
}

function resolvePublicUrl(publicUrl) {
  assert(typeof publicUrl === "string" && publicUrl.startsWith("/"), `Expected a root-relative public URL: ${publicUrl}`);
  const resolved = path.resolve(publicRoot, publicUrl.slice(1));
  assert(resolved.startsWith(`${publicRoot}${path.sep}`), `Public URL escapes the public root: ${publicUrl}`);
  return resolved;
}

function collectOwnedUrls(value, prefix, urls = []) {
  if (typeof value === "string") {
    if (value.startsWith(prefix)) urls.push(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) collectOwnedUrls(entry, prefix, urls);
  } else if (value && typeof value === "object") {
    for (const entry of Object.values(value)) collectOwnedUrls(entry, prefix, urls);
  }
  return urls;
}

async function assertOwnerDirectories(directory, expectedNames, label) {
  const actualNames = (await fs.readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expected = [...expectedNames].sort();
  assert(JSON.stringify(actualNames) === JSON.stringify(expected), `${label} contains an unlisted or missing owner folder`);
}

async function validatePortfolio() {
  const ownerRoot = path.join(contentRoot, "portfolio");
  const index = await readJson(path.join(ownerRoot, "index.json"));
  assert(Array.isArray(index.projects), "Portfolio index must contain a projects array");
  assert(new Set(index.projects).size === index.projects.length, "Portfolio index contains duplicate paths");
  await assertOwnerDirectories(ownerRoot, index.projects.map((entry) => path.dirname(entry)), "Portfolio");

  for (const listedPath of index.projects) {
    const filename = resolveListedFile(ownerRoot, listedPath);
    const project = await readJson(filename);
    const ownerDirectory = path.dirname(filename);
    assert(path.basename(ownerDirectory) === project.id, `Portfolio folder must match project id: ${project.id}`);
    assert(path.dirname(resolvePublicUrl(project.image)) === ownerDirectory, `Project image must live beside project.json: ${project.id}`);
    await fs.access(resolvePublicUrl(project.image));
    await validateTranslations(filename, project, ["title", "subtitle", "category"], `Portfolio project ${project.id}`);
  }
  return index.projects.length;
}

async function validateBlog() {
  const ownerRoot = path.join(contentRoot, "blog");
  const index = await readJson(path.join(ownerRoot, "index.json"));
  assert(Array.isArray(index.posts), "Blog index must contain a posts array");
  assert(new Set(index.posts).size === index.posts.length, "Blog index contains duplicate paths");
  await assertOwnerDirectories(ownerRoot, index.posts.map((entry) => path.dirname(entry)), "Blog");

  for (const listedPath of index.posts) {
    const filename = resolveListedFile(ownerRoot, listedPath);
    const post = await readJson(filename);
    const ownerDirectory = path.dirname(filename);
    assert(path.basename(ownerDirectory) === post.slug, `Blog folder must match post slug: ${post.slug}`);
    for (const publicUrl of collectOwnedUrls(post, "/content/blog/")) {
      const asset = resolvePublicUrl(publicUrl);
      assert(path.dirname(asset) === ownerDirectory, `Blog asset must live beside its post: ${publicUrl}`);
      await fs.access(asset);
    }
    await validateTranslations(filename, post, ["title", "abstract", "category", "lede"], `Blog post ${post.slug}`);
  }
  return index.posts.length;
}

async function validateInformation() {
  const ownerRoot = path.join(contentRoot, "information");
  const index = await readJson(path.join(ownerRoot, "index.json"));
  assert(Array.isArray(index.items), "News index must contain an items array");
  assert(Array.isArray(index.sources), "News index must contain a sources array");
  assert(new Set(index.items).size === index.items.length, "News index contains duplicate paths");
  await assertOwnerDirectories(
    path.join(ownerRoot, "items"),
    index.items.map((entry) => path.basename(path.dirname(entry))),
    "News items",
  );

  for (const listedPath of index.items) {
    const filename = resolveListedFile(ownerRoot, listedPath);
    const item = await readJson(filename);
    assert(path.basename(path.dirname(filename)) === item.uid, `News folder must match item uid: ${item.uid}`);
  }
  return index.items.length;
}

for (const legacyFile of [
  "portfolio/projects.json",
  "blog/posts.json",
  "information/items.json",
]) {
  await fs.access(path.join(contentRoot, legacyFile)).then(
    () => { throw new Error(`Legacy monolithic content file still exists: ${legacyFile}`); },
    () => undefined,
  );
}

const [projects, posts, newsItems] = await Promise.all([
  validatePortfolio(),
  validateBlog(),
  validateInformation(),
]);

console.log(`Validated ${projects} projects, ${posts} blog posts, and ${newsItems} news item folders.`);
