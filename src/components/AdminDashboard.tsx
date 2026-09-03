"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryBadge from "./CategoryBadge";
import { formatRelativeTime } from "@/lib/format";
import type { Category, Status } from "@/db/schema";

interface AdminItem {
  id: number;
  content: string;
  category: Category | null;
  status: Status;
  hasPiiWarning: boolean;
  likes: number;
  reportCount: number;
  createdAt: string;
  approvedAt: string | null;
}

type Tab = "pending" | "reported" | "approved" | "rejected";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "대기중" },
  { key: "reported", label: "신고됨" },
  { key: "approved", label: "승인됨" },
  { key: "rejected", label: "거절됨" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    const query = tab === "reported" ? "reported=true" : `status=${tab}`;
    const res = await fetch(`/api/admin/confessions?${query}`);
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setItems(data.items);
  }, [tab, router]);

  useEffect(() => {
    // Fetch-on-mount/tab-change: state updates happen after the awaited
    // request resolves, not synchronously during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleAction(id: number, action: "approve" | "reject" | "delete") {
    setBusyId(id);
    try {
      if (action === "delete") {
        await fetch(`/api/admin/confessions/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/confessions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }
      setItems((prev) => prev?.filter((item) => item.id !== id) ?? null);
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">관리자 대시보드</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-ink-soft underline decoration-dotted"
        >
          로그아웃
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
              tab === t.key
                ? "border-primary bg-primary text-white"
                : "border-border text-ink-soft hover:border-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items === null && <p className="text-sm text-ink-soft">불러오는 중...</p>}
      {items?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-ink-soft">
          해당하는 게시물이 없어요.
        </p>
      )}

      <div className="space-y-3">
        {items?.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              <span className="font-medium">#{item.id}</span>
              <CategoryBadge category={item.category} />
              <span>{formatRelativeTime(item.createdAt)}</span>
              {item.hasPiiWarning && (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[var(--color-ink)]">
                  ⚠️ 개인정보 의심
                </span>
              )}
              {item.reportCount > 0 && (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[var(--color-ink)]">
                  🚩 신고 {item.reportCount}건
                </span>
              )}
              <span className="ml-auto">🤍 {item.likes}</span>
            </div>

            <p className="whitespace-pre-wrap break-words text-sm text-ink">{item.content}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {item.status !== "approved" && (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleAction(item.id, "approve")}
                  className="rounded-full bg-mint px-3 py-1 text-xs font-medium text-[var(--color-mint-ink)] disabled:opacity-50"
                >
                  승인
                </button>
              )}
              {item.status !== "rejected" && (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleAction(item.id, "reject")}
                  className="rounded-full bg-peach px-3 py-1 text-xs font-medium text-[var(--color-peach-ink)] disabled:opacity-50"
                >
                  거절/비공개
                </button>
              )}
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => handleAction(item.id, "delete")}
                className="rounded-full bg-danger-soft px-3 py-1 text-xs font-medium text-[var(--color-ink)] disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
