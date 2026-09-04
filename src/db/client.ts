import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __libsqlClient: ReturnType<typeof createClient> | undefined;
  var __drizzleDb: Db | undefined;
}

// Lazily construct the client on first real use (a request handler), not at
// module load time. Next.js evaluates route modules during the build's
// "collecting page data" step; creating the libsql client eagerly there
// means a missing/invalid DATABASE_URL breaks the build itself instead of
// only failing requests at runtime.
function getDb(): Db {
  if (global.__drizzleDb) return global.__drizzleDb;

  // `||` on purpose, not `??` — an env var set to an empty string is just as
  // "unset" as one that's missing entirely, and Vercel dashboards make it
  // easy to save a variable with a blank value.
  const url = (process.env.DATABASE_URL?.trim() || "file:./local.db");
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

  const client =
    global.__libsqlClient ?? createClient(authToken ? { url, authToken } : { url });

  if (process.env.NODE_ENV !== "production") {
    global.__libsqlClient = client;
  }

  const db = drizzle(client, { schema });
  global.__drizzleDb = db;
  return db;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});

// Exposed for the migration runner (src/instrumentation.ts), which needs the
// real Db instance rather than the lazy Proxy above.
export { getDb };
