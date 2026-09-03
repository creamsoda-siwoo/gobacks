"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ConfessionCard, { type ConfessionCardData } from "./ConfessionCard";

export default function Feed({
  initialItems,
  initialCursor,
}: {
  initialItems: ConfessionCardData[];
  initialCursor: number | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/confessions?cursor=${cursor}`);
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center text-ink-soft">
        <p className="text-3xl">🌸</p>
        <p className="mt-2">아직 공개된 고백이 없어요.</p>
        <p className="text-sm">첫 번째 고백의 주인공이 되어보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ConfessionCard key={item.id} confession={item} />
      ))}
      <div ref={sentinelRef} className="h-1" />
      {loading && (
        <p className="py-4 text-center text-sm text-ink-soft">불러오는 중...</p>
      )}
      {cursor === null && items.length > 0 && (
        <p className="py-4 text-center text-sm text-ink-soft">마지막 고백까지 다 봤어요 🌷</p>
      )}
    </div>
  );
}
