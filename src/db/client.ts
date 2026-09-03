import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

declare global {
  var __libsqlClient: ReturnType<typeof createClient> | undefined;
}

const client =
  global.__libsqlClient ??
  createClient(authToken ? { url, authToken } : { url });

if (process.env.NODE_ENV !== "production") {
  global.__libsqlClient = client;
}

export const db = drizzle(client, { schema });
