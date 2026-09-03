import { z } from "zod";
import { CATEGORIES, REPORT_REASONS } from "@/db/schema";

export const CONFESSION_MAX_LENGTH = 500;
export const COMMENT_MAX_LENGTH = 200;

export const submitConfessionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요.")
    .max(CONFESSION_MAX_LENGTH, `${CONFESSION_MAX_LENGTH}자 이내로 입력해주세요.`),
  category: z.enum(CATEGORIES).optional(),
  captchaToken: z.string().min(1),
  captchaAnswer: z.coerce.number(),
  // Honeypot field: real users never fill this in. Bots often do.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const reportConfessionSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  detail: z.string().trim().max(300).optional(),
});

export const submitCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "댓글을 입력해주세요.")
    .max(COMMENT_MAX_LENGTH, `${COMMENT_MAX_LENGTH}자 이내로 입력해주세요.`),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

export const adminModerateSchema = z.object({
  action: z.enum(["approve", "reject"]),
});
