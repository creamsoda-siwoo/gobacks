import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { confessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adminModerateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const confessionId = Number(id);
  if (!Number.isInteger(confessionId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminModerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const nextStatus = parsed.data.action === "approve" ? "approved" : "rejected";

  const [updated] = await db
    .update(confessions)
    .set({
      status: nextStatus,
      approvedAt: nextStatus === "approved" ? new Date() : null,
    })
    .where(eq(confessions.id, confessionId))
    .returning({ id: confessions.id, status: confessions.status });

  if (!updated) {
    return NextResponse.json({ error: "게시글을 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const confessionId = Number(id);
  if (!Number.isInteger(confessionId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  await db.delete(confessions).where(eq(confessions.id, confessionId));

  return NextResponse.json({ ok: true });
}
