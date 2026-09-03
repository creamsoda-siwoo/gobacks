"use client";

import { useState } from "react";
import { REPORT_REASONS, type ReportReason } from "@/db/schema";

export default function ConfessionDetailActions({
  confessionId,
  initialLikes,
}: {
  confessionId: number;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  async function handleLike() {
    if (likePending || liked) return;
    setLikePending(true);
    try {
      const res = await fetch(`/api/confessions/${confessionId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setLiked(true);
      }
    } finally {
      setLikePending(false);
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setReportPending(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/confessions/${confessionId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, detail: detail || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setReportError(data.error ?? "신고 접수 중 오류가 발생했어요.");
        return;
      }
      setReportDone(true);
      setReportOpen(false);
    } finally {
      setReportPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleLike}
          disabled={likePending}
          className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm transition ${
            liked ? "bg-pink text-[var(--color-pink-ink)]" : "bg-primary-soft text-primary-dark hover:bg-pink"
          }`}
        >
          <span>{liked ? "💗" : "🤍"}</span>
          <span>{likes}</span>
        </button>

        <button
          type="button"
          onClick={() => setReportOpen((v) => !v)}
          className="rounded-full border border-border px-4 py-1.5 text-sm text-ink-soft hover:border-danger hover:text-danger"
        >
          🚩 신고
        </button>
      </div>

      {reportDone && (
        <p className="rounded-xl bg-mint px-4 py-2 text-sm text-[var(--color-mint-ink)]">
          신고가 접수되었어요. 확인 후 조치할게요.
        </p>
      )}

      {reportOpen && (
        <form
          onSubmit={handleReport}
          className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
        >
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-soft">신고 사유</p>
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    reason === r
                      ? "border-danger bg-danger-soft text-[var(--color-ink)]"
                      : "border-border text-ink-soft hover:border-danger"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="상세 내용 (선택)"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          {reportError && <p className="text-sm text-danger">{reportError}</p>}
          <button
            type="submit"
            disabled={reportPending}
            className="rounded-full bg-danger px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {reportPending ? "접수 중..." : "신고 접수"}
          </button>
        </form>
      )}
    </div>
  );
}
