import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const CATEGORIES = ["짝사랑", "일상", "불만", "감사", "기타"] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["pending", "approved", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const REPORT_REASONS = [
  "특정인 저격/비방",
  "개인정보 노출",
  "욕설/혐오 표현",
  "스팸/광고",
  "기타",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const confessions = sqliteTable(
  "confessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    content: text("content").notNull(),
    category: text("category").$type<Category>(),
    status: text("status").$type<Status>().notNull().default("pending"),
    hasPiiWarning: integer("has_pii_warning", { mode: "boolean" })
      .notNull()
      .default(false),
    likes: integer("likes").notNull().default(0),
    reportCount: integer("report_count").notNull().default(0),
    // HMAC hash of submitter IP, used only for rate limiting. Never returned to clients.
    ipHash: text("ip_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("confessions_status_idx").on(table.status),
    index("confessions_ip_hash_idx").on(table.ipHash),
  ]
);

export const reports = sqliteTable(
  "reports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    confessionId: integer("confession_id")
      .notNull()
      .references(() => confessions.id, { onDelete: "cascade" }),
    reason: text("reason").$type<ReportReason>().notNull(),
    detail: text("detail"),
    ipHash: text("ip_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [index("reports_confession_id_idx").on(table.confessionId)]
);

export const comments = sqliteTable(
  "comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    confessionId: integer("confession_id")
      .notNull()
      .references(() => confessions.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [index("comments_confession_id_idx").on(table.confessionId)]
);
