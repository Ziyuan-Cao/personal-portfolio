# Personal Portfolio

A small Fastify/TypeScript portfolio with folder-based project and article content plus an automatically generated news feed.

## Run locally

Requires Node.js 24 or newer.

```powershell
npm install
npm run dev
```

Open <http://127.0.0.1:3000>.

## Content

- Give every portfolio project its own `public/content/portfolio/<project-id>/` folder containing `project.json` and that project's images. Add its JSON path to `public/content/portfolio/index.json`.
- Give every blog post its own `public/content/blog/<slug>/` folder containing `post.json` and that post's images. Add its JSON path to `public/content/blog/index.json`. Each post gets a shareable `#blog/<slug>` route.
- English is the canonical content language. Add `project.ja.json` and `project.zh-CN.json`, or `post.ja.json` and `post.zh-CN.json`, beside every authored English JSON file. The browser merges the selected overlay with English as a field-level fallback.
- Use the repository skill at `.agents/skills/translate-portfolio-content/` when adding or changing UI copy, blog posts, or portfolio projects. `npm run validate:content` checks required locale files and their structure.
- Edit collection sources in `config/sources.txt`. Use one HTTP(S) URL per line; blank lines and lines beginning with `#` are ignored.
- The included sources cover Unreal, NVIDIA, Khronos, Unity, Autodesk Media & Entertainment, ACM SIGGRAPH, Eurographics, NeurIPS, ICML, ICLR, CVPR, AMD GPUOpen, DirectX, Blender, and Adobe Research.
- The server tries RSS, Atom, or JSON Feed first and falls back to generic HTML extraction. Every collected article is checked, and confirmed HTTP 404/410 or soft-404 pages are discarded before saving.
- Run `npm run collect:static` to create one `public/content/information/items/<uid>/item.json` file per news item and refresh `public/content/information/index.json`.
- The News page reads the static index and per-item JSON files, so it works on GitHub Pages without a server. Preview images remain source-owned URLs and are shown only when their actual width is greater than 480 pixels.
- News controls, dates, and states are localized. Automatically collected third-party headlines and summaries stay in their original language by default.
- Missing feed dates are recovered from article metadata, JSON-LD, visible time elements, and finally date-formatted article URLs.
- When an official page publishes no date at all, its card clearly shows when it was first collected instead of displaying an invented publication date.

When running the Fastify server locally, collected items are stored in `data/information.db`. Existing items are matched by stable UID and canonical URL, and their `last_seen_at` value is updated instead of inserting duplicates.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` collects news once a day at 06:17 JST, can also be run manually, and deploys the contents of `public/`. Failed sources retain their last good snapshot, and the workflow refuses to publish when more than `COLLECTION_FAILURE_THRESHOLD` sources fail.

After pushing the workflow, open the repository's **Settings → Pages** page and set **Source** to **GitHub Actions**. The first successful workflow run will replace the README page with the portfolio.

## Commands

- `npm run dev` — run with TypeScript watch mode
- `npm run build` — compile to `dist/`
- `npm run validate:content` — verify every content index, owner folder, JSON file, and local image reference
- `npm run collect:static` — collect sources and write the static per-item news folders
- `npm start` — run the compiled server
- `npm test` — run the strict TypeScript build, maintained collector tests, and content-layout checks
