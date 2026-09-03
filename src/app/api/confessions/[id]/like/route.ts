import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { confessions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const confessionId = Number(id);
  if (!Number.isInteger(confessionId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const [updated] = await db
    .update(confessions)
    .set({ likes: sql`${confessions.likes} + 1` })
    .where(and(eq(confessions.id, confessionId), eq(confessions.status, "approved")))
    .returning({ likes: confessions.likes });

  if (!updated) {
    return NextResponse.json({ error: "게시글을 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({ likes: updated.likes });
}
