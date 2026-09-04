export async function register() {
  // Only the Node.js server runtime can talk to the database (and only it
  // needs to) — skip this on the Edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { ensureSchema } = await import("./db/ensure-schema");
    await ensureSchema();
  } catch (err) {
    // A misconfigured DATABASE_URL (or any other DB failure) must not take
    // down every route in the app — instrumentation register() runs once at
    // server boot, so an uncaught throw here 500s the whole instance,
    // including routes that don't touch the DB at all. Log it loudly and
    // let individual requests fail with a real error instead.
    console.error("[instrumentation] Schema setup failed on boot:", err);
  }
}
