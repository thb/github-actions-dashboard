import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/db.sqlite"

// Ensure directory exists
import { mkdirSync, existsSync } from "fs"
import { dirname } from "path"
const dir = dirname(dbPath)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1',
    "order" integer DEFAULT 0,
    created_at integer DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS repos (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    project_id integer NOT NULL,
    full_name text NOT NULL,
    default_branch text DEFAULT 'main',
    "order" integer DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE cascade
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY NOT NULL,
    expires_at integer NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    "key" text PRIMARY KEY NOT NULL,
    value text NOT NULL
  );
`)

export const db = drizzle(sqlite, { schema })

export * from "./schema"
