import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { confessions, reports } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { reportConfessionSchema } from "@/lib/validation";
import { getClientIp, hashIp } from "@/lib/ip";

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
  const parsed = reportConfessionSchema.safeParse(body);
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

  const ip = getClientIp(req.headers);
  const ipHash = hashIp(ip);

  await db.insert(reports).values({
    confessionId,
    reason: parsed.data.reason,
    detail: parsed.data.detail,
    ipHash,
  });

  await db
    .update(confessions)
    .set({ reportCount: sql`${confessions.reportCount} + 1` })
    .where(eq(confessions.id, confessionId));

  return NextResponse.json({ ok: true });
}
