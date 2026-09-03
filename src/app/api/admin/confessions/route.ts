import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { confessions } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";

// Admin listing. Note: ip_hash is intentionally never selected here — even
// moderators should not see submitter identity, only content and status.
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const reportedOnly = req.nextUrl.searchParams.get("reported") === "true";

  const conditions = [];
  if (status === "pending" || status === "approved" || status === "rejected") {
    conditions.push(eq(confessions.status, status));
  }
  if (reportedOnly) {
    conditions.push(gt(confessions.reportCount, 0));
  }

  const whereClause =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const rows = await db
    .select({
      id: confessions.id,
      content: confessions.content,
      category: confessions.category,
      status: confessions.status,
      hasPiiWarning: confessions.hasPiiWarning,
      likes: confessions.likes,
      reportCount: confessions.reportCount,
      createdAt: confessions.createdAt,
      approvedAt: confessions.approvedAt,
    })
    .from(confessions)
    .where(whereClause)
    .orderBy(desc(confessions.id))
    .limit(200);

  return NextResponse.json({ items: rows });
}
