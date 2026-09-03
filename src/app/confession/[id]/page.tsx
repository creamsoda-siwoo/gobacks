import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { confessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import CategoryBadge from "@/components/CategoryBadge";
import { formatRelativeTime } from "@/lib/format";
import ConfessionDetailActions from "@/components/ConfessionDetailActions";
import Comments from "@/components/Comments";

export const dynamic = "force-dynamic";

export default async function ConfessionDetailPage({
  params,
}: PageProps<"/confession/[id]">) {
  const { id } = await params;
  const confessionId = Number(id);
  if (!Number.isInteger(confessionId)) notFound();

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

  if (!row) notFound();

  const postedAt = row.approvedAt ?? row.createdAt;

  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-soft">#{row.id}</span>
            <CategoryBadge category={row.category} />
          </div>
          <span className="text-xs text-ink-soft">{formatRelativeTime(postedAt)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
          {row.content}
        </p>
        <ConfessionDetailActions confessionId={row.id} initialLikes={row.likes} />
      </div>

      <Comments confessionId={row.id} />
    </div>
  );
}
