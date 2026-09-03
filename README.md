# 광남중 고백 게시판

누구나 익명으로 고백/사연을 제출하고, 운영자 승인을 거친 글만 공개되는 게시판입니다.

## 기술 스택

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** — 파스텔 톤 커스텀 테마 (`src/app/globals.css`)
- **SQLite (libSQL) + Drizzle ORM** — 로컬은 파일 기반, 배포는 [Turso](https://turso.tech)로 동일한 SQLite 문법 사용
- **jose (JWT)** — 관리자 세션 쿠키, 스팸 방지 캡차 토큰 서명
- **bcryptjs** — 관리자 비밀번호 해시

## 데이터 모델

`src/db/schema.ts`

| 테이블 | 설명 |
| --- | --- |
| `confessions` | `id, content, category, status(pending/approved/rejected), hasPiiWarning, likes, reportCount, ipHash, createdAt, approvedAt` |
| `reports` | `id, confessionId, reason, detail, ipHash, createdAt` |
| `comments` | `id, confessionId, content, ipHash, createdAt` |

`ipHash`는 제출자 IP를 서버 전용 시크릿으로 단방향 해시한 값으로, **레이트리밋 계산 용도로만** 쓰이며 어떤 API 응답이나 화면(관리자 포함)에도 절대 노출되지 않습니다.

## 안전장치

- 제출 시 금칙어(욕설/비속어) 포함 시 **제출 자체를 차단** (`src/lib/profanity.ts`)
- 전화번호/카톡ID/인스타/이메일/학년-반-번호 패턴 감지 시 **경고 후 사용자 확인을 받아야 제출 가능** (`src/lib/pii.ts`)
- 같은 IP에서 60초(설정 가능) 내 재제출 차단 (`src/lib/rate-limit.ts`)
- 제출 폼에 수식 캡차 + 허니팟 필드로 봇 차단
- 모든 글은 `status=pending`으로 저장되며 관리자가 승인해야 공개 피드에 노출
- 신고 기능으로 저격/비방/개인정보 노출 게시물을 별도로 관리자에게 표시

## 로컬 개발

```bash
npm install
npm run db:push     # local.db 파일에 스키마 반영
npm run dev
```

`.env.local`에 다음이 이미 설정되어 있어 바로 실행됩니다.

```
DATABASE_URL=file:./local.db
ADMIN_PASSWORD=devadmin123   # 로컬 전용 평문 비밀번호
```

- 홈: http://localhost:3000
- 고백 제출: http://localhost:3000/submit
- 관리자: http://localhost:3000/admin (로그인 비밀번호: `devadmin123`)

## 배포 (Vercel + Turso)

Vercel의 서버리스 파일시스템은 요청 간 영구 저장이 보장되지 않아 로컬 SQLite 파일을 그대로 배포하면 데이터가 사라질 수 있습니다. 대신 SQLite와 100% 호환되는 [Turso](https://turso.tech)를 사용합니다.

1. Turso 데이터베이스 생성 후 `libsql://...` URL과 auth token 발급
2. 아래 스키마를 반영: `DATABASE_URL=<turso-url> DATABASE_AUTH_TOKEN=<token> npm run db:push`
3. 관리자 비밀번호 해시 생성: `npm run hash-password -- <원하는 비밀번호>`
4. Vercel 프로젝트 환경변수에 아래 값을 설정 (모두 `openssl rand -hex 32` 등으로 랜덤 생성 권장):

```
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=...
IP_HASH_SECRET=...
CAPTCHA_SECRET=...
ADMIN_SESSION_SECRET=...
ADMIN_PASSWORD_HASH=...   # 3번에서 생성한 해시 (ADMIN_PASSWORD는 설정하지 마세요)
RATE_LIMIT_SECONDS=60
COMMENT_RATE_LIMIT_SECONDS=15
```

5. Vercel에 배포

## 프로젝트 구조

```
src/
  db/            drizzle 스키마 & 클라이언트
  lib/           금칙어/개인정보 필터, 레이트리밋, 캡차, 관리자 인증, 검증 스키마
  proxy.ts       /admin, /api/admin 경로 인증 보호
  components/    Feed, ConfessionCard, Comments, AdminDashboard 등
  app/
    page.tsx             피드 (무한 스크롤)
    submit/page.tsx       고백 제출 폼
    confession/[id]/      상세 + 댓글 + 신고
    admin/                관리자 로그인 & 대시보드
    api/                  REST 라우트
```
