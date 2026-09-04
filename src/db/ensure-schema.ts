import { sql } from "drizzle-orm";
import { getDb } from "./client";

// Idempotent schema setup, run from instrumentation.ts on server boot.
//
// This intentionally does NOT use drizzle-orm's file-based migrator
// (drizzle-orm/libsql/migrator + ./drizzle/*.sql): Next's file tracer only
// follows static imports, so a runtime fs read of the migrations folder
// silently drops it from the deployed Vercel function bundle even with
// outputFileTracingIncludes configured (observed to not take effect under
// Turbopack). Inlining the DDL as template strings makes it a normal part
// of the JS bundle instead, so there's nothing to trace.
//
// `./drizzle` is kept for `npm run db:generate`/`db:push` during local
// development — this file is the production source of truth.
const STATEMENTS = [
  sql`CREATE TABLE IF NOT EXISTS confessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    has_pii_warning INTEGER DEFAULT false NOT NULL,
    likes INTEGER DEFAULT 0 NOT NULL,
    report_count INTEGER DEFAULT 0 NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
    approved_at INTEGER
  )`,
  sql`CREATE INDEX IF NOT EXISTS confessions_status_idx ON confessions (status)`,
  sql`CREATE INDEX IF NOT EXISTS confessions_ip_hash_idx ON confessions (ip_hash)`,
  sql`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    confession_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    detail TEXT,
    ip_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
    FOREIGN KEY (confession_id) REFERENCES confessions(id) ON UPDATE no action ON DELETE cascade
  )`,
  sql`CREATE INDEX IF NOT EXISTS reports_confession_id_idx ON reports (confession_id)`,
  sql`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    confession_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
    FOREIGN KEY (confession_id) REFERENCES confessions(id) ON UPDATE no action ON DELETE cascade
  )`,
  sql`CREATE INDEX IF NOT EXISTS comments_confession_id_idx ON comments (confession_id)`,
];

export async function ensureSchema() {
  const db = getDb();
  for (const statement of STATEMENTS) {
    await db.run(statement);
  }
}
