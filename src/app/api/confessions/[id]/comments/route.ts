import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { confessions, comments } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { submitCommentSchema } from "@/lib/validation";
import { findProfanity } from "@/lib/profanity";
import { checkCommentRateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/ip";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const confessionId = Number(id);
  if (!Number.isInteger(confessionId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.confessionId, confessionId))
    .orderBy(asc(comments.createdAt));

  return NextResponse.json({ items: rows });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const confessionId = Number(id);
  if (!Number.isInteger(confessionId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const [target] = await db
    .select({ id: confessions.id })
    .from(confessions)
    .where(and(eq(confessions.id, confessionId), eq(confessions.status, "approved")));

  if (!target) {
    return NextResponse.json({ error: "게시글을 찾을 수 없어요." }, { status: 404 });
  }

  const badWord = findProfanity(parsed.data.content);
  if (badWord) {
    return NextResponse.json(
      { error: "부적절한 표현이 포함되어 있어 등록할 수 없어요." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req.headers);
  const ipHash = hashIp(ip);

  const rateLimit = await checkCommentRateLimit(ipHash);
  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        error: `너무 빠르게 작성했어요. ${rateLimit.retryAfterSeconds}초 후 다시 시도해주세요.`,
      },
      { status: 429 }
    );
  }

  const [inserted] = await db
    .insert(comments)
    .values({ confessionId, content: parsed.data.content, ipHash })
    .returning({ id: comments.id, content: comments.content, createdAt: comments.createdAt });

  return NextResponse.json({ ok: true, item: inserted });
}
