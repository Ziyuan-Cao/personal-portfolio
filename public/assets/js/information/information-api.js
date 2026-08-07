export class InformationApi {
  async request(path, options = {}) {
    const response = await fetch(path, { headers: { "content-type": "application/json", ...options.headers }, ...options });
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || `Request failed (${response.status})`);
    return data;
  }

  listContent(query = {}) {
    const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== "" && value != null));
    return this.request(`/api/content?${params}`);
  }
  listSources() { return this.request("/api/sources"); }
  testSource(source) { return this.request("/api/sources/test", { method: "POST", body: JSON.stringify(source) }); }
  createSource(source) { return this.request("/api/sources", { method: "POST", body: JSON.stringify(source) }); }
  updateSource(id, source) { return this.request(`/api/sources/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(source) }); }
  deleteSource(id) { return this.request(`/api/sources/${encodeURIComponent(id)}`, { method: "DELETE" }); }
  collectSource(id) { return this.request(`/api/sources/${encodeURIComponent(id)}/collect`, { method: "POST" }); }
  listRuns() { return this.request("/api/collection-runs?limit=12"); }
}
