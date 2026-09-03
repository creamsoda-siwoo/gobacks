import { db } from "@/db/client";
import { confessions, comments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const CONFESSION_RATE_LIMIT_SECONDS = Number(
  process.env.RATE_LIMIT_SECONDS ?? 60
);
const COMMENT_RATE_LIMIT_SECONDS = Number(
  process.env.COMMENT_RATE_LIMIT_SECONDS ?? 15
);

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

function evaluate(
  lastCreatedAt: Date | null,
  windowSeconds: number
): RateLimitResult {
  if (!lastCreatedAt) return { ok: true };
  const elapsedSeconds = (Date.now() - lastCreatedAt.getTime()) / 1000;
  if (elapsedSeconds < windowSeconds) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil(windowSeconds - elapsedSeconds),
    };
  }
  return { ok: true };
}

export async function checkConfessionRateLimit(
  ipHash: string
): Promise<RateLimitResult> {
  const [last] = await db
    .select({ createdAt: confessions.createdAt })
    .from(confessions)
    .where(eq(confessions.ipHash, ipHash))
    .orderBy(desc(confessions.createdAt))
    .limit(1);

  return evaluate(last?.createdAt ?? null, CONFESSION_RATE_LIMIT_SECONDS);
}

export async function checkCommentRateLimit(
  ipHash: string
): Promise<RateLimitResult> {
  const [last] = await db
    .select({ createdAt: comments.createdAt })
    .from(comments)
    .where(eq(comments.ipHash, ipHash))
    .orderBy(desc(comments.createdAt))
    .limit(1);

  return evaluate(last?.createdAt ?? null, COMMENT_RATE_LIMIT_SECONDS);
}
