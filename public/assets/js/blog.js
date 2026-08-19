const grid = document.querySelector("[data-blog-grid]");
const state = document.querySelector("[data-blog-state]");
const listView = document.querySelector("[data-blog-list-view]");
const detailView = document.querySelector("[data-blog-detail-view]");
const pageTitle = document.querySelector("[data-blog-page-title]");
const { element } = window.portfolioUi;
const i18n = window.portfolioI18n;
const siteRoot = new URL("../../", import.meta.url);
const blogIndexUrl = new URL("content/blog/index.json", siteRoot);
let sourcePosts = [];
let posts = [];

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

async function fetchPost(postPath) {
  const sourceUrl = new URL(postPath, blogIndexUrl);
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

function formatDate(value) {
  return new Intl.DateTimeFormat(i18n.dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function postCard(post, index) {
  const item = element("li", "blog-post-item");
  const link = element("a");
  link.href = `#blog/${encodeURIComponent(post.slug)}`;
  link.setAttribute("aria-label", i18n.t("blog.readLabel", { title: post.title }));

  const content = element("div", "blog-content");
  const meta = element("div", "blog-meta");
  const category = element("p", "blog-category", post.category);
  const dot = element("span", "dot");
  const time = element("time", "", formatDate(post.publishedAt));
  time.dateTime = post.publishedAt;
  meta.append(category, dot, time);

  const title = element("h3", "h3 blog-item-title", post.title);
  const abstract = element("p", "blog-text", post.abstract);
  const footer = element("div", "blog-card-footer");
  footer.append(element("span", "blog-read-link", i18n.t("blog.read")));
  content.append(meta, title, abstract, footer);
  if (post.cardImage) {
    const figure = element("figure", "blog-banner-box");
    const image = element("img");
    image.src = new URL(post.cardImage.replace(/^\/+/, ""), siteRoot);
    image.alt = post.cardImageAlt ?? "";
    image.loading = index === 0 ? "eager" : "lazy";
    const number = element("span", "blog-card-number", String(index + 1).padStart(2, "0"));
    figure.append(image, number);
    link.append(figure);
  } else {
    link.classList.add("blog-card-text-only");
  }
  link.append(content);
  item.append(link);
  return item;
}

function flowDiagram(flow) {
  const figure = element("figure", "blog-code blog-flow-code");
  const header = element("figcaption", "blog-code-header");
  header.append(
    element("span", "blog-code-file", flow.label),
    element("span", "blog-code-language", "text"),
  );

  const list = element("div", "blog-flow-code-list");
  list.setAttribute("role", "list");
  list.setAttribute("aria-label", flow.label);
  flow.steps.forEach((step, index) => {
    const item = element("div", "blog-flow-code-step");
    item.setAttribute("role", "listitem");
    item.append(
      element("code", "blog-flow-code-title", step.title),
      element("span", "blog-flow-code-comment", step.text),
    );
    list.append(item);

    if (index < flow.steps.length - 1) {
      const arrow = element("span", "blog-flow-code-arrow");
      arrow.setAttribute("aria-hidden", "true");
      list.append(arrow);
    }
  });

  figure.append(header, list);
  return figure;
}

function codeBlock(block) {
  const figure = element("figure", "blog-code");
  const header = element("figcaption", "blog-code-header");
  header.append(
    element("span", "blog-code-file", block.file),
    element("span", "blog-code-language", block.language),
  );
  const pre = element("pre");
  const code = element("code");
  code.textContent = block.code;
  pre.append(code);
  figure.append(header, pre);
  return figure;
}

function equationBlock(equation) {
  const figure = element("figure", "blog-equation");
  if (equation.label) figure.append(element("figcaption", "blog-equation-label", equation.label));
  const expression = element("div", "blog-equation-expression");
  const rows = Array.isArray(equation.expression) ? equation.expression : [equation.expression];
  for (const row of rows) expression.append(element("div", "blog-equation-expression-row", row));
  figure.append(expression);
  if (equation.terms?.length) {
    const terms = element("dl", "blog-equation-terms");
    for (const term of equation.terms) {
      if (typeof term === "string") {
        terms.append(element("dd", "blog-equation-term-wide", term));
      } else {
        terms.append(element("dt", "", term.symbol), element("dd", "", term.text));
      }
    }
    figure.append(terms);
  }
  return figure;
}

function technicalTable(table) {
  const figure = element("figure", "blog-table-wrap");
  const scroll = element("div", "blog-table-scroll");
  const tableElement = element("table", "blog-table");
  const head = element("thead");
  const headerRow = element("tr");
  for (const column of table.columns) headerRow.append(element("th", "", column));
  head.append(headerRow);
  const body = element("tbody");
  for (const row of table.rows) {
    const tableRow = element("tr");
    for (const cell of row) tableRow.append(element("td", "", cell));
    body.append(tableRow);
  }
  tableElement.append(head, body);
  scroll.append(tableElement);
  figure.append(scroll);
  if (table.caption) figure.append(element("figcaption", "", table.caption));
  return figure;
}

function articleFigure(figure) {
  const container = element("figure", "blog-figure");
  const image = element("img");
  image.src = new URL(figure.src.replace(/^\/+/, ""), siteRoot);
  image.alt = figure.alt;
  image.loading = "lazy";
  container.append(image);
  if (figure.caption) container.append(element("figcaption", "", figure.caption));
  return container;
}

function calloutBlock(callout) {
  const aside = element("aside", `blog-callout blog-callout-${callout.tone ?? "note"}`);
  aside.append(element("strong", "", callout.title), element("p", "", callout.text));
  return aside;
}

function referenceList(references) {
  const list = element("ul", "blog-reference-list");
  for (const reference of references) {
    const item = element("li", "blog-reference-item");
    const link = element("a", "blog-reference-link");
    link.href = reference.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(element("span", "blog-reference-title", reference.title ?? reference.label));
    if (reference.description) {
      link.append(element("span", "blog-reference-description", reference.description));
    }
    const icon = document.createElement("ion-icon");
    icon.setAttribute("name", "open-outline");
    icon.setAttribute("aria-hidden", "true");
    link.append(icon);
    item.append(link);
    list.append(item);
  }
  return list;
}

function documentationLinks(links) {
  const aside = element("aside", "blog-doc-links");
  aside.append(element("strong", "blog-doc-links-title", i18n.t("blog.docs")));
  const list = element("ul");
  for (const entry of links) {
    const item = element("li");
    const link = element("a", "", entry.label);
    link.href = entry.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const icon = document.createElement("ion-icon");
    icon.setAttribute("name", "open-outline");
    icon.setAttribute("aria-hidden", "true");
    link.append(icon);
    item.append(link);
    if (entry.note) item.append(element("span", "", entry.note));
    list.append(item);
  }
  aside.append(list);
  return aside;
}

function appendInlineMarkdownLinks(container, text) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) container.append(document.createTextNode(text.slice(cursor, match.index)));
    const link = element("a", "blog-inline-link", match[1]);
    link.href = match[2];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    container.append(link);
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) container.append(document.createTextNode(text.slice(cursor)));
}

function sourceLinkList(sourceIds, sourceCatalog, className) {
  const links = element("ul", className);
  for (const id of sourceIds ?? []) {
    const source = sourceCatalog[id];
    if (!source) continue;
    const listItem = element("li");
    const link = element("a", "", source.label);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const icon = document.createElement("ion-icon");
    icon.setAttribute("name", "open-outline");
    icon.setAttribute("aria-hidden", "true");
    link.append(icon);
    listItem.append(link);
    links.append(listItem);
  }
  return links;
}

function keywordDetailList(details) {
  const disclosure = element("details", "blog-keyword-details");
  const summary = element("summary", "", i18n.t("blog.keywordDetails", { count: details.length }));
  disclosure.append(summary);
  const list = element("div", "blog-keyword-detail-list");

  for (const detail of details) {
    const item = element("article", "blog-keyword-detail");
    item.append(element("h4", "", detail.keyword));

    const meaning = element("div", "blog-keyword-detail-field");
    meaning.append(
      element("strong", "", i18n.t("blog.keywordMeaning")),
      element("p", "", detail.explanation),
    );
    item.append(meaning);

    if (detail.equation) {
      const equation = element("div", "blog-keyword-detail-field blog-keyword-equation");
      equation.append(
        element("strong", "", i18n.t("blog.keywordEquation")),
        element("code", "", detail.equation.expression),
        element("p", "", detail.equation.note),
      );
      item.append(equation);
    }

    const aiNote = element("div", "blog-keyword-detail-field blog-keyword-ai-note");
    aiNote.append(
      element("strong", "", i18n.t("blog.keywordAiNote")),
      element("p", "", detail.aiNote),
    );
    item.append(aiNote);
    list.append(item);
  }

  disclosure.append(list);
  return disclosure;
}

function aiResearchBlock(research, sourceCatalog) {
  const aside = element("aside", "blog-ai-research");
  aside.append(
    element("strong", "blog-ai-research-title", i18n.t("blog.currentAiResearch")),
    element("p", "blog-ai-research-summary", research.summary),
    sourceLinkList(research.sourceIds, sourceCatalog, "blog-ai-research-links"),
  );
  return aside;
}

function keywordSources(groups, sourceCatalog) {
  const aside = element("aside", "blog-keyword-sources");
  aside.append(element("strong", "blog-keyword-sources-title", i18n.t("blog.keywordSources")));
  const list = element("div", "blog-keyword-source-list");

  for (const group of groups) {
    const item = element("section", "blog-keyword-source-item");
    const keywordList = element("ul", "blog-keyword-source-keywords");
    keywordList.setAttribute("aria-label", i18n.t("blog.keywordSources"));
    for (const keyword of group.keywords) {
      keywordList.append(element("li", "blog-keyword-source-keyword", keyword));
    }
    item.append(keywordList);
    if (group.summary) item.append(element("p", "blog-keyword-source-summary", group.summary));
    if (group.details?.length) item.append(keywordDetailList(group.details));
    item.append(sourceLinkList(group.sourceIds, sourceCatalog, "blog-keyword-source-links"));
    list.append(item);
  }

  aside.append(list);
  return aside;
}

function numberedStepList(steps) {
  const list = element("ol", "blog-numbered-steps");
  for (const step of steps) {
    const item = element("li");
    if (typeof step === "string") {
      item.append(element("p", "", step));
    } else {
      item.append(element("strong", "", step.title), element("p", "", step.text));
    }
    list.append(item);
  }
  return list;
}

function articleSection(section, index, sourceCatalog = {}) {
  const container = element("section", "blog-article-section");
  if (section.partLabel) container.append(element("p", "blog-part-label", section.partLabel));
  const headingRow = element("div", "blog-section-heading");
  headingRow.append(
    element("span", "blog-section-number", String(index + 1).padStart(2, "0")),
    element("h2", "", section.heading),
  );
  container.append(headingRow);

  for (const paragraph of section.paragraphs ?? []) {
    const node = element("p");
    appendInlineMarkdownLinks(node, paragraph);
    container.append(node);
  }

  if (section.aiResearch) container.append(aiResearchBlock(section.aiResearch, sourceCatalog));

  if (section.keywordSourceGroups?.length) {
    container.append(keywordSources(section.keywordSourceGroups, sourceCatalog));
  }

  if (section.docLinks?.length) container.append(documentationLinks(section.docLinks));

  for (const block of section.codeBlocks ?? []) {
    container.append(codeBlock(block));
  }

  for (const equation of section.equations ?? []) container.append(equationBlock(equation));

  for (const table of [...(section.tables ?? []), ...(section.technicalTables ?? [])]) {
    container.append(technicalTable(table));
  }

  for (const figure of section.figures ?? []) container.append(articleFigure(figure));

  for (const callout of section.callouts ?? []) container.append(calloutBlock(callout));

  if (section.flow) container.append(flowDiagram(section.flow));

  if (section.numberedSteps?.length) container.append(numberedStepList(section.numberedSteps));

  if (section.bullets?.length) {
    const list = element("ul", "blog-article-list");
    for (const bullet of section.bullets) list.append(element("li", "", bullet));
    container.append(list);
  }

  if (section.references?.length) container.append(referenceList(section.references));
  return container;
}

function renderList() {
  listView.hidden = false;
  detailView.hidden = true;
  pageTitle.textContent = i18n.t("blog.title");
  state.textContent = posts.length ? "" : i18n.t("blog.empty");
  grid.replaceChildren(...posts.map(postCard));
  document.title = i18n.t("site.title");
}

function renderDetail(post) {
  const back = element("a", "blog-back", i18n.t("blog.allPosts"));
  back.href = "#blog";

  const header = element("header", "blog-article-header");
  const meta = element("div", "blog-article-meta");
  const time = element("time", "", formatDate(post.publishedAt));
  time.dateTime = post.publishedAt;
  meta.append(element("span", "blog-category-pill", post.category), time);
  header.append(meta, element("h1", "", post.title), element("p", "blog-article-deck", post.abstract));

  const hero = element("figure", "blog-article-hero");
  const image = element("img");
  image.src = new URL(post.image.replace(/^\/+/, ""), siteRoot);
  image.alt = post.imageAlt;
  hero.append(image);

  const body = element("div", "blog-article-body");
  body.append(element("p", "blog-article-lede", post.lede));
  post.sections.forEach((section, index) => body.append(articleSection(section, index, post.sourceCatalog)));
  if (post.references?.length) {
    body.append(articleSection(
      { heading: i18n.t("blog.sources"), references: post.references },
      post.sections.length,
    ));
  }

  const closing = element("footer", "blog-article-footer");
  closing.append(
    element("p", "", post.closing ?? i18n.t("blog.defaultClosing")),
    Object.assign(element("a", "blog-back blog-back-bottom", i18n.t("blog.more")), { href: "#blog" }),
  );

  detailView.replaceChildren(back, header, hero, body, closing);
  listView.hidden = true;
  detailView.hidden = false;
  pageTitle.textContent = i18n.t("blog.journal", { number: String(posts.indexOf(post) + 1).padStart(3, "0") });
  state.textContent = "";
  document.title = `${post.title} - ${i18n.t("profile.name")}`;
}

function renderRoute() {
  const [page, encodedSlug] = window.location.hash.slice(1).split("/");
  if (page !== "blog" || !encodedSlug) {
    renderList();
    return;
  }
  const slug = decodeURIComponent(encodedSlug);
  const post = posts.find((candidate) => candidate.slug === slug);
  if (post) renderDetail(post);
  else {
    renderList();
    state.textContent = i18n.t("blog.notFound");
  }
}

async function loadBlog() {
  try {
    const manifest = await fetchJson(blogIndexUrl);
    if (!Array.isArray(manifest.posts)) throw new Error("The blog index has an invalid format");
    sourcePosts = await Promise.all(manifest.posts.map(fetchPost));
    posts = sourcePosts.map(i18n.localizeContent);
    renderRoute();
  } catch (error) {
    state.textContent = i18n.t("blog.loadError", { message: error.message });
  }
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("portfolio:localechange", () => {
  posts = sourcePosts.map(i18n.localizeContent);
  renderRoute();
});
loadBlog();
