const placeholder = "./assets/images/information-placeholder.png";

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

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export class InformationView {
  constructor() {
    this.grid = document.querySelector("[data-information-grid]");
    this.state = document.querySelector("[data-information-state]");
    this.more = document.querySelector("[data-information-more]");
    this.updated = document.querySelector("[data-information-updated]");
    this.source = document.querySelector("[data-information-source]");
  }
  setLoading(append = false) { if (!append) { this.grid.replaceChildren(); this.state.textContent = "Loading information…"; } this.more.disabled = true; }
  setError(message) { this.state.textContent = `Could not load information. ${message}`; this.more.hidden = true; }
  renderSources(sources) {
    const selected = this.source.value;
    this.source.replaceChildren(new Option("All sources", ""), ...sources.map(item => new Option(item.name, item.id)));
    this.source.value = selected;
  }
  render(items, { append = false, hasMore = false } = {}) {
    if (!append) this.grid.replaceChildren();
    for (const item of items) this.grid.append(this.card(item));
    this.state.textContent = this.grid.children.length ? "" : "No information matches these filters yet. Add a source or try a broader search.";
    this.more.hidden = !hasMore; this.more.disabled = false;
    this.updated.textContent = `Last updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
  }
  card(item) {
    const card = element("article", "information-card");
    const link = element("a"); link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer";
    const media = element("div", "information-card-image");
    const image = element("img"); image.src = item.imageUrl || placeholder; image.alt = ""; image.loading = "lazy"; image.addEventListener("error", () => { if (!image.src.endsWith("information-placeholder.png")) image.src = placeholder; }, { once: true });
    const external = element("span", "information-card-external"); external.innerHTML = '<ion-icon name="open-outline"></ion-icon>';
    media.append(image, external);
    const body = element("div", "information-card-body"); const meta = element("div", "information-card-meta");
    meta.append(element("span", "source-badge", item.sourceName), element("span", "", "·"), element("time", "", formatTime(item.publishedAt)));
    body.append(meta, element("h3", "", item.title)); if (item.subtitle) body.append(element("p", "", item.subtitle));
    link.append(media, body); card.append(link); return card;
  }
}
