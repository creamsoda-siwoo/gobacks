import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { confessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const confessionId = Number(id);
  if (!Number.isInteger(confessionId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const [row] = await db
    .select({
      id: confessions.id,
      content: confessions.content,
      category: confessions.category,
      likes: confessions.likes,
      createdAt: confessions.createdAt,
      approvedAt: confessions.approvedAt,
    })
    .from(confessions)
    .where(and(eq(confessions.id, confessionId), eq(confessions.status, "approved")));

  if (!row) {
    return NextResponse.json({ error: "게시글을 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    content: row.content,
    category: row.category,
    likes: row.likes,
    postedAt: row.approvedAt ?? row.createdAt,
  });
}
