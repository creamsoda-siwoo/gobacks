import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // instrumentation.ts reads ./drizzle/**/* from disk at runtime (drizzle-orm's
  // migrator), but Next's file tracer only follows static imports — it can't
  // see that dependency, so the migrations folder gets dropped from the
  // deployed function bundle unless we force-include it here.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
};

export default nextConfig;
