export async function register() {
  // Only the Node.js server runtime can talk to the database (and only it
  // needs to) — skip this on the Edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    const { getDb } = await import("./db/client");

    // Applies any migration in ./drizzle that isn't yet recorded in the DB's
    // journal table. Safe to run on every cold start: already-applied
    // migrations are skipped.
    await migrate(getDb(), { migrationsFolder: "./drizzle" });
  } catch (err) {
    // A misconfigured DATABASE_URL (or any other migration failure) must
    // not take down every route in the app — instrumentation register()
    // runs once at server boot, so an uncaught throw here 500s the whole
    // instance, including routes that don't touch the DB at all. Log it
    // loudly and let individual requests fail with a real error instead.
    console.error("[instrumentation] DB migration failed on boot:", err);
  }
}
