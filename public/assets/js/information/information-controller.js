import { InformationApi } from "./information-api.js";
import { InformationView } from "./information-view.js";
import { SourceSettingsView } from "./source-settings-view.js";

const api = new InformationApi(); const view = new InformationView(); let cursor = null; let debounce;
const sourceFilter = document.querySelector("[data-information-source]"); const search = document.querySelector("[data-information-search]"); const sort = document.querySelector("[data-information-sort]");

async function load({ append = false } = {}) {
  view.setLoading(append);
  try { const page = await api.listContent({ sourceId: sourceFilter.value, search: search.value.trim(), sort: sort.value, cursor: append ? cursor : "", limit: 12 }); cursor = page.nextCursor; view.render(page.items, { append, hasMore: Boolean(cursor) }); }
  catch (error) { view.setError(error.message); }
}
async function reloadAll() { try { const sources = await api.listSources(); view.renderSources(sources.items); } catch { /* content error state provides feedback */ } await load(); }

document.querySelector("[data-information-refresh]").addEventListener("click", () => reloadAll());
document.querySelector("[data-information-more]").addEventListener("click", () => load({ append: true }));
sourceFilter.addEventListener("change", () => load()); sort.addEventListener("change", () => load());
search.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(() => load(), 280); });
new SourceSettingsView(api, reloadAll);
reloadAll();
