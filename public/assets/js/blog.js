const grid = document.querySelector("[data-blog-grid]");
const state = document.querySelector("[data-blog-state]");
const listView = document.querySelector("[data-blog-list-view]");
const detailView = document.querySelector("[data-blog-detail-view]");
const pageTitle = document.querySelector("[data-blog-page-title]");
const intro = document.querySelector("[data-blog-intro]");
const { element } = window.portfolioUi;
const siteRoot = new URL("../../", import.meta.url);
const postsUrl = new URL("content/blog/posts.json", siteRoot);
const defaultDocumentTitle = document.title;
let posts = [];

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

  const figure = element("figure", "blog-banner-box");
  const image = element("img");
  image.src = new URL(post.image.replace(/^\/+/, ""), siteRoot);
  image.alt = post.imageAlt;
  image.loading = index === 0 ? "eager" : "lazy";
  const number = element("span", "blog-card-number", String(index + 1).padStart(2, "0"));
  figure.append(image, number);

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
  footer.append(
    element("span", "blog-reading-time", post.readingTime),
    element("span", "blog-read-link", "Read article \u2197"),
  );
  content.append(meta, title, abstract, footer);
  link.append(figure, content);
  item.append(link);
  return item;
}

function flowDiagram(flow) {
  const figure = element("figure", "blog-flow");
  const list = element("ol", "blog-flow-list");
  for (const step of flow.steps) {
    const item = element("li", "blog-flow-step");
    const iconBox = element("div", "blog-flow-icon");
    const icon = document.createElement("ion-icon");
    icon.setAttribute("name", step.icon);
    icon.setAttribute("aria-hidden", "true");
    iconBox.append(icon);
    const copy = element("div", "blog-flow-copy");
    copy.append(element("strong", "", step.title), element("span", "", step.text));
    item.append(iconBox, copy);
    list.append(item);
  }
  figure.append(list, element("figcaption", "", flow.label));
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

function referenceList(references) {
  const list = element("ul", "blog-reference-list");
  for (const reference of references) {
    const item = element("li", "blog-reference-item");
    const link = element("a", "blog-reference-link");
    link.href = reference.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(
      element("span", "blog-reference-title", reference.title),
      element("span", "blog-reference-description", reference.description),
    );
    const icon = document.createElement("ion-icon");
    icon.setAttribute("name", "open-outline");
    icon.setAttribute("aria-hidden", "true");
    link.append(icon);
    item.append(link);
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

  for (const block of section.codeBlocks ?? []) {
    container.append(codeBlock(block));
  }

  if (section.flow) container.append(flowDiagram(section.flow));

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
  meta.append(element("span", "blog-category-pill", post.category), time, element("span", "", post.readingTime));
  header.append(meta, element("h1", "", post.title), element("p", "blog-article-deck", post.abstract));

  const hero = element("figure", "blog-article-hero");
  const image = element("img");
  image.src = new URL(post.image.replace(/^\/+/, ""), siteRoot);
  image.alt = post.imageAlt;
  hero.append(image);

  const body = element("div", "blog-article-body");
  body.append(element("p", "blog-article-lede", post.lede));
  post.sections.forEach((section, index) => body.append(articleSection(section, index)));

  const closing = element("footer", "blog-article-footer");
  closing.append(
    element("p", "", "That is the whole system: small pieces, clear ownership, and an automated path from source to screen."),
    Object.assign(element("a", "blog-back blog-back-bottom", "Read more notes \u2192"), { href: "#blog" }),
  );

  detailView.replaceChildren(back, header, hero, body, closing);
  listView.hidden = true;
  detailView.hidden = false;
  pageTitle.textContent = "Journal / 001";
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
    const response = await fetch(postsUrl, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    posts = await response.json();
    renderRoute();
  } catch (error) {
    state.textContent = `Could not load blog posts. ${error.message}`;
  }
}

window.addEventListener("hashchange", renderRoute);
loadBlog();
