"use client";

import { useState } from "react";
import Link from "next/link";
import CategoryBadge from "./CategoryBadge";
import { formatRelativeTime } from "@/lib/format";
import type { Category } from "@/db/schema";

export interface ConfessionCardData {
  id: number;
  content: string;
  category: Category | null;
  likes: number;
  postedAt: string | number | Date;
}

function likedKey(id: number) {
  return `confession-liked-${id}`;
}

export default function ConfessionCard({ confession }: { confession: ConfessionCardData }) {
  const [likes, setLikes] = useState(confession.likes);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const alreadyLiked =
      typeof window !== "undefined" && localStorage.getItem(likedKey(confession.id));
    if (alreadyLiked || liked) return;

    setPending(true);
    try {
      const res = await fetch(`/api/confessions/${confession.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setLiked(true);
        localStorage.setItem(likedKey(confession.id), "1");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Link
      href={`/confession/${confession.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-soft">#{confession.id}</span>
          <CategoryBadge category={confession.category} />
        </div>
        <span className="text-xs text-ink-soft">{formatRelativeTime(confession.postedAt)}</span>
      </div>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
        {confession.content}
      </p>

      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={handleLike}
          disabled={pending}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition ${
            liked
              ? "bg-pink text-[var(--color-pink-ink)]"
              : "bg-primary-soft text-primary-dark hover:bg-pink"
          }`}
        >
          <span>{liked ? "💗" : "🤍"}</span>
          <span>{likes}</span>
        </button>
      </div>
    </Link>
  );
}
