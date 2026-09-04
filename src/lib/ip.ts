import { createHash } from "crypto";

/**
 * Extracts the best-effort client IP from request headers.
 * Only ever used to derive a one-way hash for rate limiting — never stored
 * or displayed in raw form anywhere in the app.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * One-way HMAC-style hash of an IP address, salted with a server-only
 * secret. Used solely to rate-limit submissions; the hash is never exposed
 * via any API response or UI.
 */
export function hashIp(ip: string): string {
  // `||` on purpose, not `??` — an env var saved with a blank value is just
  // as "unset" as one that's missing entirely (see src/db/client.ts).
  const secret = process.env.IP_HASH_SECRET || "dev-only-insecure-secret-change-me";
  return createHash("sha256").update(secret).update(ip).digest("hex");
}
