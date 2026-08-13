const grid = document.querySelector("[data-portfolio-grid]");
const state = document.querySelector("[data-portfolio-state]");
const { element } = window.portfolioUi;
const i18n = window.portfolioI18n;
const siteRoot = new URL("../../", import.meta.url);
const portfolioIndexUrl = new URL("content/portfolio/index.json", siteRoot);

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

async function fetchOptionalJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

async function fetchProject(projectPath) {
  const sourceUrl = new URL(projectPath, portfolioIndexUrl);
  const source = await fetchJson(sourceUrl);
  const extensionIndex = sourceUrl.pathname.lastIndexOf(".json");
  const localeUrls = ["ja", "zh-CN"].map((locale) => {
    const localized = new URL(sourceUrl);
    localized.pathname = `${sourceUrl.pathname.slice(0, extensionIndex)}.${locale}.json`;
    return localized;
  });
  const [ja, zhCN] = await Promise.all(localeUrls.map(fetchOptionalJson));
  source.locales = { ...(source.locales ?? {}), ...(ja && { ja }), ...(zhCN && { "zh-CN": zhCN }) };
  return source;
}

let projects = [];

function projectCard(project) {
  const item = element("li", "project-item active");
  item.dataset.filterItem = "";
  item.dataset.category = project.filterCategory;
  item.dataset.projectId = project.id;
  const link = element("a");
  link.href = project.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const figure = element("figure", "project-img");
  const icon = element("div", "project-item-icon-box");
  icon.innerHTML = '<ion-icon name="eye-outline"></ion-icon>';
  const image = element("img");
  image.src = new URL(project.image.replace(/^\/+/, ""), siteRoot);
  image.alt = project.title;
  image.loading = "lazy";
  figure.append(icon, image);
  link.append(
    figure,
    element("h3", "project-title", project.title),
    element("p", "project-abstract", project.subtitle),
    element("p", "project-category", project.category),
  );
  item.append(link);
  return item;
}

async function loadPortfolio() {
  try {
    const manifest = await fetchJson(portfolioIndexUrl);
    if (!Array.isArray(manifest.projects)) throw new Error("The portfolio index has an invalid format");
    projects = await Promise.all(manifest.projects.map(fetchProject));
    renderPortfolio();
  } catch (error) {
    state.textContent = i18n.t("portfolio.loadError", { message: error.message });
  }
}

function renderPortfolio() {
    const localizedProjects = projects.map((project) => ({
      ...i18n.localizeContent(project),
      filterCategory: project.category,
    }));
    grid.replaceChildren(...localizedProjects.map(projectCard));
    state.textContent = localizedProjects.length ? "" : i18n.t("portfolio.empty");
    window.dispatchEvent(new CustomEvent("portfolio:loaded"));
}

window.addEventListener("portfolio:localechange", renderPortfolio);
loadPortfolio();
