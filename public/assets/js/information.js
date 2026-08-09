const placeholder = "/assets/images/information-placeholder.png";
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
let cursor = null;
let debounce;
let attemptedInitialRefresh = false;

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
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" }).format(date);
}

function card(item) {
  const article = element("article", "information-card");
  const link = element("a");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const media = element("div", "information-card-image");
  const image = element("img");
  image.src = item.imageUrl || placeholder;
  image.alt = "";
  image.loading = "lazy";
  image.addEventListener("error", () => { image.src = placeholder; }, { once: true });
  const external = element("span", "information-card-external");
  external.innerHTML = '<ion-icon name="open-outline"></ion-icon>';
  media.append(image, external);
  const body = element("div", "information-card-body");
  const meta = element("div", "information-card-meta");
  meta.append(element("span", "source-badge", item.sourceName), element("span", "", "·"), element("time", "", formatTime(item.publishedAt)));
  body.append(meta, element("h3", "", item.title));
  if (item.subtitle) body.append(element("p", "", item.subtitle));
  link.append(media, body);
  article.append(link);
  return article;
}

async function request(path, options) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Request failed (${response.status})`);
  return data;
}

async function load({ append = false, refreshIfEmpty = false } = {}) {
  if (!append) {
    grid.replaceChildren();
    state.textContent = "Loading information…";
  }
  more.disabled = true;
  const params = new URLSearchParams({ limit: "12", sort: sort.value });
  if (sourceFilter.value) params.set("sourceUrl", sourceFilter.value);
  if (search.value.trim()) params.set("search", search.value.trim());
  if (append && cursor) params.set("cursor", cursor);
  try {
    let page = await request(`/api/content?${params}`);
    if (refreshIfEmpty && !page.items.length && !attemptedInitialRefresh) {
      attemptedInitialRefresh = true;
      state.textContent = "Collecting the latest information…";
      await request("/api/refresh", { method: "POST" });
      page = await request(`/api/content?${params}`);
    }
    cursor = page.nextCursor;
    if (!append) grid.replaceChildren();
    for (const item of page.items) grid.append(card(item));
    const selected = sourceFilter.value;
    sourceFilter.replaceChildren(new Option("All sources", ""), ...page.sources.map((source) => new Option(source.name, source.url)));
    sourceFilter.value = selected;
    state.textContent = grid.children.length ? "" : "No information matches these filters yet.";
    more.hidden = !cursor;
    more.disabled = false;
    updated.textContent = `Last updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
  } catch (error) {
    state.textContent = `Could not load information. ${error.message}`;
    more.hidden = true;
  }
}

refresh.addEventListener("click", async () => {
  refresh.disabled = true;
  refresh.querySelector("span").textContent = "Collecting…";
  try {
    await request("/api/refresh", { method: "POST" });
    await load();
  } catch (error) {
    state.textContent = `Could not refresh information. ${error.message}`;
  } finally {
    refresh.disabled = false;
    refresh.querySelector("span").textContent = "Refresh";
  }
});

more.addEventListener("click", () => load({ append: true }));
sourceFilter.addEventListener("change", () => load());
sort.addEventListener("change", () => load());
search.addEventListener("input", () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => load(), 280);
});

load({ refreshIfEmpty: true });
