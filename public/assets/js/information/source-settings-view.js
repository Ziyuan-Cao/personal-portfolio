const selectorNames = ["itemSelector", "linkSelector", "titleSelector", "subtitleSelector", "imageSelector", "dateSelector", "nextPageSelector"];
const displayDate = value => value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Never";

export class SourceSettingsView {
  constructor(api, onChanged) {
    this.api = api; this.onChanged = onChanged; this.dialog = document.querySelector("[data-source-dialog]"); this.form = document.querySelector("[data-source-form]"); this.list = document.querySelector("[data-source-list]"); this.history = document.querySelector("[data-collection-history]"); this.result = document.querySelector("[data-source-test-result]"); this.testToken = null; this.sources = [];
    document.querySelector("[data-manage-sources]").addEventListener("click", () => this.open());
    document.querySelector("[data-source-close]").addEventListener("click", () => this.dialog.close());
    document.querySelector("[data-new-source]").addEventListener("click", () => this.reset());
    document.querySelector("[data-test-source]").addEventListener("click", () => this.test());
    document.querySelector("[data-preview-source]").addEventListener("click", () => { this.result.scrollIntoView({ behavior: "smooth", block: "nearest" }); this.result.classList.add("preview-highlight"); setTimeout(() => this.result.classList.remove("preview-highlight"), 700); });
    this.form.addEventListener("submit", event => { event.preventDefault(); this.save(); });
    this.form.elements.adapterType.addEventListener("change", () => this.toggleAdvanced());
    this.form.addEventListener("input", () => { this.testToken = null; document.querySelector("[data-preview-source]").disabled = true; });
    this.dialog.addEventListener("click", event => { if (event.target === this.dialog) this.dialog.close(); });
  }
  async open() { if (!this.dialog.open) this.dialog.showModal(); await this.reload(); }
  async reload() {
    try { const [sourcePage, runPage] = await Promise.all([this.api.listSources(), this.api.listRuns()]); this.sources = sourcePage.items; this.renderSources(); this.renderHistory(runPage.items); }
    catch (error) { this.result.className = "source-test-result error"; this.result.textContent = error.message; }
  }
  renderSources() {
    this.list.replaceChildren();
    if (!this.sources.length) { const empty = document.createElement("p"); empty.className = "source-list-empty"; empty.textContent = "No sources yet. Add one, test it, and start collecting."; this.list.append(empty); return; }
    for (const source of this.sources) {
      const row = document.createElement("article"); row.className = `source-row${this.form.elements.id.value === source.id ? " active" : ""}`;
      const main = document.createElement("div"); main.className = "source-row-main"; const name = document.createElement("h4"); name.textContent = source.name; const status = document.createElement("span"); status.className = `source-status ${source.status.toLowerCase()}`; status.textContent = source.status; main.append(name, status);
      const details = document.createElement("p"); details.className = "source-row-details"; details.textContent = `${source.adapterType} · next ${displayDate(source.nextCollectionAt)}`;
      const actions = document.createElement("div"); actions.className = "source-row-actions";
      const edit = this.action("Edit", () => this.edit(source)); const collect = this.action("Collect now", () => this.collect(source, collect)); const remove = this.action("Delete", () => this.remove(source), "danger"); actions.append(edit, collect, remove); row.append(main, details, actions); this.list.append(row);
    }
  }
  action(label, callback, className = "") { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.className = className; button.addEventListener("click", callback); return button; }
  renderHistory(runs) {
    this.history.replaceChildren();
    if (!runs.length) { const empty = document.createElement("p"); empty.className = "source-list-empty"; empty.textContent = "No collection runs yet."; this.history.append(empty); return; }
    for (const run of runs) { const row = document.createElement("div"); row.className = "history-row"; const state = document.createElement("span"); state.className = `history-${run.status.toLowerCase()}`; state.textContent = run.status; const name = document.createElement("strong"); name.textContent = run.sourceName; row.append(name, document.createTextNode(` · `), state, document.createTextNode(` · ${run.insertedCount} new · ${displayDate(run.startedAt)}`)); this.history.append(row); }
  }
  reset() { this.form.reset(); this.form.elements.id.value = ""; this.form.elements.intervalMinutes.value = "60"; this.form.elements.maxItemsPerRun.value = "30"; this.form.elements.enabled.checked = true; document.querySelector("[data-source-form-title]").textContent = "Add a source"; this.result.className = "source-test-result"; this.result.textContent = "Test the source to preview its first items before enabling it."; document.querySelector("[data-preview-source]").disabled = true; this.testToken = null; this.toggleAdvanced(); this.renderSources(); }
  edit(source) { this.reset(); for (const name of ["id", "name", "baseUrl", "collectionUrl", "feedUrl", "adapterType", "intervalMinutes", "maxItemsPerRun"]) this.form.elements[name].value = source[name] ?? ""; this.form.elements.enabled.checked = source.enabled; for (const name of selectorNames) this.form.elements[name].value = source.adapterConfig?.[name] ?? ""; document.querySelector("[data-source-form-title]").textContent = `Edit ${source.name}`; this.toggleAdvanced(); this.renderSources(); }
  toggleAdvanced() { document.querySelector("[data-html-fields]").hidden = this.form.elements.adapterType.value !== "HTML"; }
  value() { const data = new FormData(this.form); const baseUrl = String(data.get("baseUrl") || ""); const config = Object.fromEntries(selectorNames.map(name => [name, String(data.get(name) || "").trim()]).filter(([, value]) => value)); return { name: String(data.get("name") || ""), baseUrl, collectionUrl: String(data.get("collectionUrl") || baseUrl), feedUrl: String(data.get("feedUrl") || "") || null, adapterType: String(data.get("adapterType")), adapterConfig: config, intervalMinutes: Number(data.get("intervalMinutes")), maxItemsPerRun: Number(data.get("maxItemsPerRun")), enabled: this.form.elements.enabled.checked }; }
  async test() {
    if (!this.form.reportValidity()) return; const button = document.querySelector("[data-test-source]"); button.disabled = true; this.result.className = "source-test-result"; this.result.textContent = "Testing source and preparing a preview…";
    try { const response = await this.api.testSource(this.value()); this.testToken = response.testToken; document.querySelector("[data-preview-source]").disabled = false; this.result.className = "source-test-result success"; this.result.replaceChildren(); const summary = document.createElement("p"); summary.textContent = `${response.items.length} valid preview item${response.items.length === 1 ? "" : "s"} via ${response.adapter}.`; this.result.append(summary); for (const item of response.items) { const row = document.createElement("div"); row.className = "preview-item"; const title = document.createElement("strong"); title.textContent = item.title; row.append(title); if (item.subtitle) row.append(document.createTextNode(` — ${item.subtitle}`)); this.result.append(row); } }
    catch (error) { this.testToken = null; this.result.className = "source-test-result error"; this.result.textContent = error.message; }
    finally { button.disabled = false; }
  }
  async save() {
    if (!this.form.reportValidity()) return; const button = document.querySelector("[data-save-source]"); button.disabled = true;
    try { const value = { ...this.value(), testToken: this.testToken }; const id = this.form.elements.id.value; if (id) await this.api.updateSource(id, value); else await this.api.createSource(value); this.reset(); await this.reload(); await this.onChanged(); }
    catch (error) { this.result.className = "source-test-result error"; this.result.textContent = error.message; }
    finally { button.disabled = false; }
  }
  async collect(source, button) { button.disabled = true; button.textContent = "Collecting…"; try { await this.api.collectSource(source.id); await this.reload(); await this.onChanged(); } catch (error) { this.result.className = "source-test-result error"; this.result.textContent = error.message; } finally { button.disabled = false; button.textContent = "Collect now"; } }
  async remove(source) { if (!confirm(`Delete “${source.name}” and all collected items from it?`)) return; try { await this.api.deleteSource(source.id); if (this.form.elements.id.value === source.id) this.reset(); await this.reload(); await this.onChanged(); } catch (error) { this.result.className = "source-test-result error"; this.result.textContent = error.message; } }
}
