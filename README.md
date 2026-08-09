# Personal Portfolio

A small Fastify/TypeScript portfolio with a file-based project list and an automatically generated information feed.

## Run locally

Requires Node.js 24 or newer.

```powershell
npm install
npm run dev
```

Open <http://127.0.0.1:3000>.

## Content

- Edit portfolio entries in `public/content/portfolio/projects.json` and put their images in `public/content/portfolio/images/`.
- Edit collection sources in `config/sources.txt`. Use one HTTP(S) URL per line; blank lines and lines beginning with `#` are ignored.
- The server tries RSS, Atom, or JSON Feed first and falls back to generic HTML extraction.
- Run `npm run collect:static` to collect the configured sources into `public/content/information/items.json`.
- The Information page reads that static JSON file, so it works on GitHub Pages without a server.

When running the Fastify server locally, collected items are stored in `data/information.db`. Existing items are matched by stable UID and canonical URL, and their `last_seen_at` value is updated instead of inserting duplicates.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` collects information every hour, can also be run manually, and deploys the contents of `public/`.

After pushing the workflow, open the repository's **Settings → Pages** page and set **Source** to **GitHub Actions**. The first successful workflow run will replace the README page with the portfolio.

## Commands

- `npm run dev` — run with TypeScript watch mode
- `npm run build` — compile to `dist/`
- `npm run collect:static` — collect sources and write the static information JSON
- `npm start` — run the compiled server
- `npm test` — run the strict TypeScript build check
