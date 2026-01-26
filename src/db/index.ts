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
export const db = drizzle(sqlite, { schema })

export * from "./schema"
