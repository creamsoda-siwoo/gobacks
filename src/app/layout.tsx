import type { Metadata } from "next";
import { Gowun_Dodum } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const gowunDodum = Gowun_Dodum({
  variable: "--font-gowun",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "광남중 고백 게시판",
  description: "누구나 익명으로 고백과 사연을 남길 수 있는 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${gowunDodum.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var t = localStorage.getItem('theme');
            if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
          } catch (e) {}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">💌</span>
              <span className="font-semibold text-primary-dark">
                광남중 고백 게시판
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/submit"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark"
              >
                고백하기
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          {children}
        </main>

        <footer className="border-t border-border py-6 text-center text-xs text-ink-soft">
          <p>모든 게시물은 운영자 검수 후 공개됩니다 · 제출자 정보는 저장되지 않아요</p>
          <Link href="/admin" className="mt-1 inline-block underline decoration-dotted">
            관리자
          </Link>
        </footer>
      </body>
    </html>
  );
}
