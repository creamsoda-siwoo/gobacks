export async function register() {
  // Only the Node.js server runtime can talk to the database (and only it
  // needs to) — skip this on the Edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { migrate } = await import("drizzle-orm/libsql/migrator");
  const { getDb } = await import("./db/client");

  // Applies any migration in ./drizzle that isn't yet recorded in the DB's
  // journal table. Safe to run on every cold start: already-applied
  // migrations are skipped.
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
}
