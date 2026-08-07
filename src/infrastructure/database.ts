import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { migrate } from "./migrations.js";

export function openDatabase(filename: string): DatabaseSync {
  if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });
  const database = new DatabaseSync(filename);
  migrate(database);
  return database;
}
