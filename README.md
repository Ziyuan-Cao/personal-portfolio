# Personal Portfolio

A small Fastify/TypeScript portfolio with a file-based project list and a SQLite-backed information collector.

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
- Click **Refresh** on the Information page to reload `sources.txt` and collect immediately.

Collected items are stored in `data/information.db`. Existing items are matched by stable UID and canonical URL, and their `last_seen_at` value is updated instead of inserting duplicates.

## Commands

- `npm run dev` — run with TypeScript watch mode
- `npm run build` — compile to `dist/`
- `npm start` — run the compiled server
- `npm test` — run the strict TypeScript build check
