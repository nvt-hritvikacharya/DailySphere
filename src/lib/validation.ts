import { z } from "zod";

/** Only http(s) links may be stored, so saved URLs can never become javascript: or data: hrefs. */
export const httpUrl = z
  .string()
  .max(2000)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links are allowed");
