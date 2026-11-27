import { z } from "zod";
import { INTEREST_IDS } from "./interests";

/** Only http(s) links may be stored, so saved URLs can never become javascript: or data: hrefs. */
export const httpUrl = z
  .string()
  .max(2000)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links are allowed");

/** Article categories are interest ids; anything else is stored as null so it can't bloat analytics. */
export const interestCategory = z
  .string()
  .max(50)
  .nullish()
  .transform((c) => (c && (INTEREST_IDS as string[]).includes(c) ? c : null));
