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

function formatTime(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Date unavailable";
  const elapsed = Date.now() - date.valueOf();
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

function formatItemTime(item) {
  if (item.publishedAt) return formatTime(item.publishedAt);
  if (item.firstSeenAt) return `Found ${formatTime(item.firstSeenAt).toLocaleLowerCase()}`;
  return "Date unavailable";
}

function itemTimestamp(item) {
  const value = Date.parse(item.publishedAt || item.firstSeenAt || "");
  return Number.isNaN(value) ? 0 : value;
}

function card(item) {
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
  state.textContent = visible.length ? "" : "No news matches these filters yet.";
  more.hidden = visible.length >= filtered.length;
  more.disabled = false;
}

async function load() {
  grid.replaceChildren();
  state.textContent = "Loading news…";
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

  const version = encodeURIComponent(manifest.generatedAt ?? Date.now());
  items = await Promise.all(manifest.items.map(async (itemPath) => {
    const itemUrl = new URL(itemPath, informationIndexUrl);
    itemUrl.searchParams.set("v", version);
    const itemResponse = await fetch(itemUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!itemResponse.ok) throw new Error(`Could not load ${itemPath} (${itemResponse.status})`);
    return itemResponse.json();
  }));
  const selected = sourceFilter.value;
  sourceFilter.replaceChildren(
    new Option("All sources", ""),
    ...manifest.sources.map((source) => new Option(source.name, source.url)),
  );
  sourceFilter.value = manifest.sources.some((source) => source.url === selected) ? selected : "";
  updated.textContent = manifest.generatedAt
    ? `Collected ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(manifest.generatedAt))}`
    : "Waiting for the first scheduled collection";
  render();
}

refresh.addEventListener("click", async () => {
  refresh.disabled = true;
  refresh.querySelector("span").textContent = "Reloading…";
  try {
    await load();
  } catch (error) {
    state.textContent = `Could not load news. ${error.message}`;
  } finally {
    refresh.disabled = false;
    refresh.querySelector("span").textContent = "Reload";
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
  state.textContent = `Could not load news. ${error.message}`;
});
