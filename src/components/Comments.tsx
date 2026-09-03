"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import { COMMENT_MAX_LENGTH } from "@/lib/validation";

interface CommentItem {
  id: number;
  content: string;
  createdAt: string;
}

export default function Comments({ confessionId }: { confessionId: number }) {
  const [items, setItems] = useState<CommentItem[] | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/confessions/${confessionId}/comments`)
      .then((res) => res.json())
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, [confessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/confessions/${confessionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "댓글 등록 중 오류가 발생했어요.");
        return;
      }
      setItems((prev) => [...(prev ?? []), data.item]);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-ink-soft">
        댓글 {items ? `(${items.length})` : ""}
      </h2>

      <div className="space-y-2">
        {items === null && <p className="text-sm text-ink-soft">불러오는 중...</p>}
        {items?.length === 0 && (
          <p className="text-sm text-ink-soft">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>
        )}
        {items?.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
            <p className="whitespace-pre-wrap break-words text-ink">{c.content}</p>
            <p className="mt-1 text-xs text-ink-soft">{formatRelativeTime(c.createdAt)}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder="따뜻한 댓글을 남겨주세요"
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          등록
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
