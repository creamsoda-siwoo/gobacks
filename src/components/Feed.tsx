"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ConfessionCard, { type ConfessionCardData } from "./ConfessionCard";
import { CATEGORIES, type Category } from "@/db/schema";

type Sort = "latest" | "likes";

function buildQuery(opts: {
  cursor?: string | null;
  category: Category | null;
  sort: Sort;
  search: string;
}) {
  const params = new URLSearchParams();
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.category) params.set("category", opts.category);
  if (opts.sort === "likes") params.set("sort", "likes");
  if (opts.search.trim()) params.set("q", opts.search.trim());
  return params.toString();
}

export default function Feed({
  initialItems,
  initialCursor,
}: {
  initialItems: ConfessionCardData[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [sort, setSort] = useState<Sort>("latest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFirstRun = useRef(true);
  // loadMore's identity is intentionally NOT tied to `cursor` (see below), so
  // it reads the latest cursor through this ref instead of a stale closure.
  const cursorRef = useRef(initialCursor);

  // Debounce the raw search input before it drives a refetch.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadMore = useCallback(
    async (reset = false) => {
      if (loading) return;
      if (!reset && cursorRef.current === null) return;

      setLoading(true);
      try {
        const query = buildQuery({
          cursor: reset ? null : cursorRef.current,
          category,
          sort,
          search,
        });
        const res = await fetch(`/api/confessions?${query}`);
        if (res.ok) {
          const data = await res.json();
          setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
          cursorRef.current = data.nextCursor;
          setCursor(data.nextCursor);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, category, sort, search]
  );

  // Refetch page 1 whenever a filter changes (skip the very first render,
  // which already has the server-rendered default-filter data as props).
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch when a filter actually changes, not on every loadMore identity change
  }, [category, sort, search]);

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

  return (
    <div>
      <div className="mb-4 space-y-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="🔍 내용 검색"
          className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              category === null
                ? "border-primary bg-primary text-white"
                : "border-border text-ink-soft hover:border-primary"
            }`}
          >
            전체
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? null : c)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                category === c
                  ? "border-primary bg-primary text-white"
                  : "border-border text-ink-soft hover:border-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {([
            { key: "latest", label: "최신순" },
            { key: "likes", label: "인기순" },
          ] as const).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                sort === s.key
                  ? "bg-primary-soft text-primary-dark"
                  : "text-ink-soft hover:bg-primary-soft"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center text-ink-soft">
          <p className="text-3xl">🌸</p>
          <p className="mt-2">조건에 맞는 고백이 없어요.</p>
          <p className="text-sm">다른 검색어나 카테고리로 찾아보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ConfessionCard key={item.id} confession={item} />
          ))}
          <div ref={sentinelRef} className="h-1" />
          {loading && <p className="py-4 text-center text-sm text-ink-soft">불러오는 중...</p>}
          {cursor === null && items.length > 0 && !loading && (
            <p className="py-4 text-center text-sm text-ink-soft">마지막 고백까지 다 봤어요 🌷</p>
          )}
        </div>
      )}
    </div>
  );
}
