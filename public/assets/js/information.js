const siteRoot = new URL("../../", import.meta.url);
const informationIndexUrl = new URL("content/information/index.json", siteRoot);
const grid = document.querySelector("[data-information-grid]");
const state = document.querySelector("[data-information-state]");
const more = document.querySelector("[data-information-more]");
const updated = document.querySelector("[data-information-updated]");
const sourceFilter = document.querySelector("[data-information-source]");
const search = document.querySelector("[data-information-search]");
const sort = document.querySelector("[data-information-sort]");
const refresh = document.querySelector("[data-information-refresh]");
const i18n = window.portfolioI18n;
const element = window.portfolioUi?.element ?? ((tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
});
const pageSize = 12;
let items = [];
let visibleCount = pageSize;
let debounce;
let latestManifest = null;

function formatTime(value) {
  if (!value) return i18n.t("news.unavailable");
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return i18n.t("news.unavailable");
  const elapsed = Date.now() - date.valueOf();
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return i18n.t("news.justNow");
  if (hours < 24) return i18n.t("news.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return i18n.t("news.daysAgo", { count: days });
  return new Intl.DateTimeFormat(i18n.dateLocale, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

function formatItemTime(item) {
  if (item.publishedAt) return formatTime(item.publishedAt);
  if (item.firstSeenAt) return i18n.t("news.found", { time: formatTime(item.firstSeenAt) });
  return i18n.t("news.unavailable");
}

function itemTimestamp(item) {
  const value = Date.parse(item.publishedAt || item.firstSeenAt || "");
  return Number.isNaN(value) ? 0 : value;
}

function card(sourceItem) {
  const item = i18n.localizeContent(sourceItem);
  const article = element("article", "information-card");
  const link = element("a");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const body = element("div", "information-card-body");
  const meta = element("div", "information-card-meta");
  meta.append(
    element("span", "source-badge", item.sourceName),
    element("span", "", "·"),
    element("time", "", formatItemTime(item)),
  );
  body.append(meta, element("h3", "", item.title));
  if (item.subtitle) body.append(element("p", "", item.subtitle));
  if (item.imageUrl) {
    const media = element("div", "information-card-image");
    const image = element("img");
    image.src = item.imageUrl;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => { media.remove(); }, { once: true });
    const external = element("span", "information-card-external");
    external.innerHTML = '<ion-icon name="open-outline"></ion-icon>';
    media.append(image, external);
    link.append(media);
  }
  link.append(body);
  article.append(link);
  return article;
}

function filteredItems() {
  const term = search.value.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => {
    if (sourceFilter.value && item.sourceUrl !== sourceFilter.value) return false;
    if (!term) return true;
    return `${item.title} ${item.subtitle || ""}`.toLocaleLowerCase().includes(term);
  });
  const direction = sort.value === "oldest" ? 1 : -1;
  return filtered.sort((left, right) => direction * (itemTimestamp(left) - itemTimestamp(right)));
}

function render({ reset = true } = {}) {
  if (reset) visibleCount = pageSize;
  const filtered = filteredItems();
  const visible = filtered.slice(0, visibleCount);
  grid.replaceChildren(...visible.map(card));
  state.textContent = visible.length ? "" : i18n.t("news.empty");
  more.hidden = visible.length >= filtered.length;
  more.disabled = false;
}

function renderCollectionStatus(manifest) {
  const collected = manifest.generatedAt
    ? i18n.t("news.collected", { time: new Intl.DateTimeFormat(i18n.dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(manifest.generatedAt)) })
    : i18n.t("news.awaiting");
  const collection = manifest.collection;
  updated.textContent = collection && Number.isInteger(collection.attempted)
    ? i18n.t(collection.failed ? "news.collectionPartial" : "news.collectionHealthy", {
        collected,
        attempted: collection.attempted,
        succeeded: collection.succeeded,
        failed: collection.failed,
      })
    : collected;
}

async function load() {
  grid.replaceChildren();
  state.textContent = i18n.t("news.loading");
  more.hidden = true;
  const response = await fetch(`${informationIndexUrl.href}?v=${Date.now()}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const manifest = await response.json();
  if (!Array.isArray(manifest.items) || !Array.isArray(manifest.sources)) {
    throw new Error("The news index has an invalid format");
  }
  latestManifest = manifest;

  const version = encodeURIComponent(manifest.generatedAt ?? Date.now());
  const results = await Promise.allSettled(manifest.items.map(async (itemPath) => {
    const itemUrl = new URL(itemPath, informationIndexUrl);
    itemUrl.searchParams.set("v", version);
    const itemResponse = await fetch(itemUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!itemResponse.ok) throw new Error(`Could not load ${itemPath} (${itemResponse.status})`);
    return itemResponse.json();
  }));
  items = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const failedItems = results.filter((result) => result.status === "rejected");
  if (!items.length && manifest.items.length) throw new Error("None of the news items could be loaded");
  if (failedItems.length) console.warn(`[news] ${failedItems.length} item(s) could not be loaded`, failedItems);
  const selected = sourceFilter.value;
  sourceFilter.replaceChildren(
    new Option(i18n.t("news.allSources"), ""),
    ...manifest.sources.map((source) => new Option(source.name, source.url)),
  );
  sourceFilter.value = manifest.sources.some((source) => source.url === selected) ? selected : "";
  renderCollectionStatus(manifest);
  render();
}

refresh.addEventListener("click", async () => {
  refresh.disabled = true;
  refresh.querySelector("span").textContent = i18n.t("news.reloading");
  try {
    await load();
  } catch (error) {
    state.textContent = i18n.t("news.loadError", { message: error.message });
  } finally {
    refresh.disabled = false;
    refresh.querySelector("span").textContent = i18n.t("news.reload");
  }
});

more.addEventListener("click", () => {
  visibleCount += pageSize;
  render({ reset: false });
});
sourceFilter.addEventListener("change", () => render());
sort.addEventListener("change", () => render());
search.addEventListener("input", () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => render(), 280);
});

load().catch((error) => {
  state.textContent = i18n.t("news.loadError", { message: error.message });
});

window.addEventListener("portfolio:localechange", () => {
  const selected = sourceFilter.value;
  if (sourceFilter.options.length) sourceFilter.options[0].textContent = i18n.t("news.allSources");
  sourceFilter.value = selected;
  if (latestManifest) renderCollectionStatus(latestManifest);
  if (items.length) render();
});
