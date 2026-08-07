# Personal Portfolio Information Hub

The existing portfolio is served from `public/`, with an Information page backed by a modular Fastify/TypeScript application. Collection and persistence stay outside the browser code.

## Run locally

Requires Node.js 24 or newer.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:3000`, choose **Information**, then **Manage sources**. An enabled source must pass **Test source** before it can be saved.

## Commands

- `npm run build` — strict TypeScript build
- `npm test` — unit and integration tests using stored fixtures
- `npm start` — run the compiled application
- `npm run db:backup` — copy the configured database into `data/backups/`
- `npm run db:restore -- <backup-file>` — validate and restore a SQLite backup, preserving the current database first

## Architecture

- `src/domain` contains content rules and value objects with no Fastify or SQLite imports.
- `src/application` contains source, collection, scheduling, and listing use cases.
- `src/ports` defines storage, fetching, scheduling, clock, ID, and collector boundaries.
- `src/adapters` contains HTTP routes, SQLite repositories, the scheduler, and feed/HTML collectors.
- `public/assets/js/information` contains only API, view, and controller code for the Information UI.

The centralized fetcher accepts only HTTP(S), rejects credentials and local/private/link-local targets, validates every redirect, caps response time and size, retries temporary failures, and supports conditional requests. Collection metadata is deduplicated transactionally by source UID first and canonical URL hash second.

Before public deployment, put the management API behind authentication and review every configured site’s terms and robots policy. The collector is intended for public metadata and summaries, never paywalled or access-controlled content.
