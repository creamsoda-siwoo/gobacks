import { db } from "@/db/client";
import { confessions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Feed from "@/components/Feed";

const PAGE_SIZE = 20;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await db
    .select({
      id: confessions.id,
      content: confessions.content,
      category: confessions.category,
      likes: confessions.likes,
      createdAt: confessions.createdAt,
      approvedAt: confessions.approvedAt,
    })
    .from(confessions)
    .where(eq(confessions.status, "approved"))
    .orderBy(desc(confessions.id))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE).map((row) => ({
    id: row.id,
    content: row.content,
    category: row.category,
    likes: row.likes,
    postedAt: (row.approvedAt ?? row.createdAt).toISOString(),
  }));
  const nextCursor = hasMore ? String(items[items.length - 1]?.id) : null;

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[var(--color-lavender)] via-[var(--color-pink)] to-[var(--color-peach)] p-5 text-center">
        <p className="font-medium text-ink">💌 하고 싶었던 말, 여기 익명으로 남겨보세요</p>
        <p className="mt-1 text-sm text-ink-soft">모든 글은 운영자 확인 후 공개됩니다</p>
      </div>
      <Feed initialItems={items} initialCursor={nextCursor} />
    </div>
  );
}
