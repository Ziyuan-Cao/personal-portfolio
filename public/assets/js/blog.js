const grid = document.querySelector("[data-blog-grid]");
const state = document.querySelector("[data-blog-state]");
const listView = document.querySelector("[data-blog-list-view]");
const detailView = document.querySelector("[data-blog-detail-view]");
const pageTitle = document.querySelector("[data-blog-page-title]");
const intro = document.querySelector("[data-blog-intro]");
const { element } = window.portfolioUi;
const siteRoot = new URL("../../", import.meta.url);
const blogIndexUrl = new URL("content/blog/index.json", siteRoot);
const defaultDocumentTitle = document.title;
let posts = [];

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
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
  link.setAttribute("aria-label", `Read ${post.title}`);

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
  footer.append(element("span", "blog-read-link", "Read article \u2197"));
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
  figure.append(element("div", "blog-equation-expression", equation.expression));
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
  aside.append(element("strong", "blog-doc-links-title", "Read with the docs open"));
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

function articleSection(section, index) {
  const container = element("section", "blog-article-section");
  const headingRow = element("div", "blog-section-heading");
  headingRow.append(
    element("span", "blog-section-number", String(index + 1).padStart(2, "0")),
    element("h2", "", section.heading),
  );
  container.append(headingRow);

  for (const paragraph of section.paragraphs ?? []) {
    container.append(element("p", "", paragraph));
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
  pageTitle.textContent = "Blog";
  intro.hidden = false;
  state.textContent = posts.length ? "" : "No blog posts are currently published.";
  grid.replaceChildren(...posts.map(postCard));
  document.title = defaultDocumentTitle;
}

function renderDetail(post) {
  const back = element("a", "blog-back", "\u2190 All posts");
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
  post.sections.forEach((section, index) => body.append(articleSection(section, index)));
  if (post.references?.length) {
    body.append(articleSection(
      { heading: "Sources and further reading", references: post.references },
      post.sections.length,
    ));
  }

  const closing = element("footer", "blog-article-footer");
  closing.append(
    element("p", "", post.closing ?? "The useful result is not only the technique, but a clearer model of where its assumptions and trade-offs live."),
    Object.assign(element("a", "blog-back blog-back-bottom", "Read more notes \u2192"), { href: "#blog" }),
  );

  detailView.replaceChildren(back, header, hero, body, closing);
  listView.hidden = true;
  detailView.hidden = false;
  pageTitle.textContent = `Journal / ${String(posts.indexOf(post) + 1).padStart(3, "0")}`;
  intro.hidden = true;
  state.textContent = "";
  document.title = `${post.title} - Ziyuan Cao`;
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
    state.textContent = "That post could not be found.";
  }
}

async function loadBlog() {
  try {
    const manifest = await fetchJson(blogIndexUrl);
    if (!Array.isArray(manifest.posts)) throw new Error("The blog index has an invalid format");
    posts = await Promise.all(
      manifest.posts.map((postPath) => fetchJson(new URL(postPath, blogIndexUrl))),
    );
    renderRoute();
  } catch (error) {
    state.textContent = `Could not load blog posts. ${error.message}`;
  }
}

window.addEventListener("hashchange", renderRoute);
loadBlog();
