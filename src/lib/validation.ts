import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d]/g, ""))
  .refine((value) => /^\d{8,15}$/.test(value), "رقم واتساب غير صالح");

export const textMessageSchema = z.object({
  content: z.string().trim().min(1).max(4096),
});

export const templateSchema = z.object({
  name: z.string().trim().regex(/^[a-z0-9_]{1,512}$/),
  body: z.string().trim().min(1).max(4096),
  category: z.enum(["AUTHENTICATION", "MARKETING", "UTILITY"]).default("UTILITY"),
  status: z.enum(["APPROVED", "PENDING", "REJECTED", "PAUSED"]).default("APPROVED"),
  language: z.string().trim().min(2).max(10).default("ar"),
});
