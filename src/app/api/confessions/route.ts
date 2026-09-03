import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { confessions } from "@/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { submitConfessionSchema } from "@/lib/validation";
import { findProfanity } from "@/lib/profanity";
import { detectPii } from "@/lib/pii";
import { checkConfessionRateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { getClientIp, hashIp } from "@/lib/ip";

const PAGE_SIZE = 20;

// Public feed: approved confessions only, newest first, cursor-paginated.
export async function GET(req: NextRequest) {
  const cursorParam = req.nextUrl.searchParams.get("cursor");
  const cursor = cursorParam ? Number(cursorParam) : undefined;

  const rows = await db
    .select({
      id: confessions.id,
      content: confessions.content,
      category: confessions.category,
      likes: confessions.likes,
      reportCount: confessions.reportCount,
      createdAt: confessions.createdAt,
      approvedAt: confessions.approvedAt,
    })
    .from(confessions)
    .where(
      cursor
        ? and(eq(confessions.status, "approved"), lt(confessions.id, cursor))
        : eq(confessions.status, "approved")
    )
    .orderBy(desc(confessions.id))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE).map((row) => ({
    id: row.id,
    content: row.content,
    category: row.category,
    likes: row.likes,
    postedAt: row.approvedAt ?? row.createdAt,
  }));

  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ items, nextCursor });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = submitConfessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const { content, category, captchaToken, captchaAnswer, website } = parsed.data;

  // Honeypot tripped — pretend success so bots don't learn to avoid the field.
  if (website) {
    return NextResponse.json({ ok: true, piiWarnings: [] });
  }

  const captchaOk = await verifyCaptcha(captchaToken, captchaAnswer);
  if (!captchaOk) {
    return NextResponse.json(
      { error: "캡차 확인에 실패했어요. 다시 시도해주세요." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req.headers);
  const ipHash = hashIp(ip);

  const rateLimit = await checkConfessionRateLimit(ipHash);
  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        error: `너무 빠르게 제출했어요. ${rateLimit.retryAfterSeconds}초 후 다시 시도해주세요.`,
      },
      { status: 429 }
    );
  }

  const badWord = findProfanity(content);
  if (badWord) {
    return NextResponse.json(
      { error: "부적절한 표현이 포함되어 있어 제출할 수 없어요." },
      { status: 400 }
    );
  }

  const piiWarnings = detectPii(content);

  const [inserted] = await db
    .insert(confessions)
    .values({
      content,
      category,
      status: "pending",
      hasPiiWarning: piiWarnings.length > 0,
      ipHash,
    })
    .returning({ id: confessions.id });

  return NextResponse.json({ ok: true, id: inserted.id, piiWarnings });
}
