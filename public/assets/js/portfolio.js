const grid = document.querySelector("[data-portfolio-grid]");
const state = document.querySelector("[data-portfolio-state]");
const { element } = window.portfolioUi;
const siteRoot = new URL("../../", import.meta.url);
const portfolioIndexUrl = new URL("content/portfolio/index.json", siteRoot);

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

function projectCard(project) {
  const item = element("li", "project-item active");
  item.dataset.filterItem = "";
  item.dataset.category = project.category;
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
    const projects = await Promise.all(
      manifest.projects.map((projectPath) => fetchJson(new URL(projectPath, portfolioIndexUrl))),
    );
    grid.replaceChildren(...projects.map(projectCard));
    state.textContent = projects.length ? "" : "No portfolio projects are currently published.";
    window.dispatchEvent(new CustomEvent("portfolio:loaded"));
  } catch (error) {
    state.textContent = `Could not load portfolio projects. ${error.message}`;
  }
}

loadPortfolio();
