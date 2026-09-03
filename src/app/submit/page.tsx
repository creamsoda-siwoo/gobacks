"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type Category } from "@/db/schema";
import { CONFESSION_MAX_LENGTH } from "@/lib/validation";
import { detectPii } from "@/lib/pii";

interface Captcha {
  question: string;
  token: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Tracks the exact content the user already confirmed despite a PII
  // warning; any further edit invalidates it since it no longer matches.
  const [confirmedContent, setConfirmedContent] = useState<string | null>(null);

  const refreshCaptcha = useCallback(async () => {
    const res = await fetch("/api/captcha");
    if (res.ok) setCaptcha(await res.json());
  }, []);

  useEffect(() => {
    // Fetch-on-mount: state update happens after the awaited request
    // resolves, not synchronously during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCaptcha();
  }, [refreshCaptcha]);

  const piiWarnings = useMemo(
    () => (content.trim() ? detectPii(content) : []),
    [content]
  );
  const confirmDespitePii = confirmedContent === content;

  const remaining = CONFESSION_MAX_LENGTH - content.length;
  const canSubmit = useMemo(
    () => content.trim().length > 0 && remaining >= 0 && !submitting,
    [content, remaining, submitting]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (piiWarnings.length > 0 && !confirmDespitePii) {
      return; // require explicit confirmation first
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          category: category ?? undefined,
          captchaToken: captcha?.token,
          captchaAnswer: Number(captchaAnswer),
          website,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "제출 중 오류가 발생했어요.");
        await refreshCaptcha();
        setCaptchaAnswer("");
        return;
      }

      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <p className="text-4xl">🌷</p>
        <h1 className="mt-3 text-lg font-semibold">고백이 접수되었어요</h1>
        <p className="mt-2 text-sm text-ink-soft">
          운영자 검수 후 피드에 게시됩니다. 잠시만 기다려주세요!
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          피드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">고백 남기기</h1>
        <p className="mt-1 text-sm text-ink-soft">
          운영자 검수 후 게시됩니다. 특정인을 저격하거나 비방하는 글은 게시되지 않아요.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="하고 싶었던 말을 편하게 적어보세요..."
          rows={7}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink placeholder:text-ink-soft focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <span className={`text-xs ${remaining < 0 ? "text-danger" : "text-ink-soft"}`}>
            {content.length} / {CONFESSION_MAX_LENGTH}
          </span>
        </div>
      </div>

      {piiWarnings.length > 0 && (
        <div className="rounded-2xl border border-danger bg-danger-soft p-4 text-sm text-[var(--color-ink)]">
          <p className="font-medium">
            개인정보로 보이는 내용({piiWarnings.join(", ")})이 포함된 것 같아요.
          </p>
          <p className="mt-1 text-ink-soft">
            전화번호, SNS 아이디 등은 본인과 상대방 모두에게 위험할 수 있어요.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmDespitePii}
              onChange={(e) => setConfirmedContent(e.target.checked ? content : null)}
            />
            이 내용을 그대로 제출할게요
          </label>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink-soft">카테고리 (선택)</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? null : c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                category === c
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-ink-soft hover:border-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <label className="text-sm font-medium text-ink-soft">
          스팸 방지 확인: {captcha?.question ?? "불러오는 중..."}
        </label>
        <input
          type="number"
          value={captchaAnswer}
          onChange={(e) => setCaptchaAnswer(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="계산 결과를 입력해주세요"
          required
        />
      </div>

      {/* Honeypot field — hidden from real users via CSS, bots often fill it in. */}
      <div className="hidden" aria-hidden="true">
        <label>
          웹사이트
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-2 text-sm text-[var(--color-ink)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || (piiWarnings.length > 0 && !confirmDespitePii)}
        className="w-full rounded-full bg-primary py-3 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "제출 중..." : "고백 제출하기"}
      </button>
    </form>
  );
}
