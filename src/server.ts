import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { collectSources } from "./collector.js";
import { openDatabase, type InformationDatabase } from "./database.js";
import { loadSources } from "./utils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicPath = path.join(root, "public");
const sourcesPath = path.join(root, "config", "sources.txt");
const databasePath = process.env.DATABASE_PATH === ":memory:"
  ? ":memory:"
  : path.resolve(root, process.env.DATABASE_PATH ?? "data/information.db");

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function buildServer(database: InformationDatabase = openDatabase(databasePath)) {
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024 });
  let sources = loadSources(sourcesPath);
  let activeRefresh: Promise<Awaited<ReturnType<typeof collectSources>>> | null = null;

  const refresh = (reloadConfig: boolean) => {
    if (activeRefresh) return activeRefresh;
    if (reloadConfig) sources = loadSources(sourcesPath);
    activeRefresh = collectSources(sources, database).finally(() => { activeRefresh = null; });
    return activeRefresh;
  };

  app.get<{
    Querystring: { source?: string; sourceUrl?: string; search?: string; sort?: string; cursor?: string; limit?: string };
  }>("/api/content", async (request) => {
    return database.list({
      sourceUrl: request.query.sourceUrl ?? request.query.source,
      search: request.query.search?.trim(),
      sort: request.query.sort === "oldest" ? "oldest" : "newest",
      cursor: request.query.cursor,
      limit: Math.min(Math.max(Number(request.query.limit) || 12, 1), 50),
    });
  });

  app.post("/api/refresh", async () => {
    const result = await refresh(true);
    return { ...result, sourceCount: sources.length };
  });

  await app.register(fastifyStatic, { root: publicPath, prefix: "/" });

  const intervalMinutes = positiveInteger(process.env.COLLECTION_INTERVAL_MINUTES, 60);
  const timer = setInterval(() => {
    void refresh(false).catch((error: unknown) => {
      console.error(`[collector] ${error instanceof Error ? error.message : String(error)}`);
    });
  }, intervalMinutes * 60_000);
  timer.unref();

  app.addHook("onClose", async () => {
    clearInterval(timer);
    database.close();
  });

  return { app, refresh };
}

const { app, refresh } = await buildServer();
const host = process.env.HOST ?? "127.0.0.1";
const port = positiveInteger(process.env.PORT, 3000);

try {
  await app.listen({ host, port });
  console.log(`Portfolio server listening at http://${host}:${port}`);
  void refresh(false).catch((error: unknown) => {
    console.error(`[collector] ${error instanceof Error ? error.message : String(error)}`);
  });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
