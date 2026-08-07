import path from "node:path";

function integer(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

export interface AppConfig {
  host: string;
  port: number;
  databasePath: string;
  publicPath: string;
  schedulerPollMs: number;
  collectionPaused: boolean;
  failureThreshold: number;
  http: { timeoutMs: number; maxBytes: number; userAgent: string; maxRedirects: number };
}

export function loadConfig(root = process.cwd()): AppConfig {
  const configuredDatabasePath=process.env.DATABASE_PATH ?? "./data/information.db";
  return {
    host: process.env.HOST ?? "127.0.0.1",
    port: integer("PORT", 3000),
    databasePath: configuredDatabasePath === ":memory:" ? configuredDatabasePath : path.resolve(root, configuredDatabasePath),
    publicPath: path.resolve(root, "public"),
    schedulerPollMs: integer("SCHEDULER_POLL_MS", 60_000),
    collectionPaused: process.env.COLLECTION_PAUSED === "true",
    failureThreshold: integer("COLLECTION_FAILURE_THRESHOLD", 5),
    http: {
      timeoutMs: integer("HTTP_TIMEOUT_MS", 10_000),
      maxBytes: integer("HTTP_MAX_BYTES", 5_242_880),
      userAgent: process.env.HTTP_USER_AGENT ?? "PersonalPortfolioInformationCollector/1.0 (+https://example.com)",
      maxRedirects: 5,
    },
  };
}
