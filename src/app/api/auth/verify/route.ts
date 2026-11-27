import { NextResponse } from "next/server";
import { z } from "zod";
import { establishSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { authMode } from "@/lib/env";
import { log } from "@/lib/logger";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase/server";

const DEMO_OTP = "123456";

const schema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +919876543210").optional(),
    token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  })
  .refine((v) => v.email || v.phone, "Email or phone is required");

export async function POST(req: Request) {
  if (!rateLimit(`verify:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const { email, phone, token } = parsed.data;
  if (!rateLimit(`verify:${(email ?? phone)!.toLowerCase()}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const mode = authMode();
  if (mode !== "supabase" && mode !== "demo") return NextResponse.json({ error: "Code sign-in is not enabled" }, { status: 404 });
  let supabaseId: string | undefined;
  if (mode === "supabase") {
    const supabase = (await getSupabase())!;
    const { data, error } = email
      ? await supabase.auth.verifyOtp({ email, token, type: "email" })
      : await supabase.auth.verifyOtp({ phone: phone!, token, type: "sms" });
    if (error || !data.user) return NextResponse.json({ error: error?.message ?? "Invalid code" }, { status: 400 });
    supabaseId = data.user.id;
  } else if (token !== DEMO_OTP) {
    return NextResponse.json({ error: `Invalid code (demo mode: use ${DEMO_OTP})` }, { status: 400 });
  }

  // A successful Supabase verifyOtp proves control of the email/phone it was sent to; demo mode
  // proves nothing but is only enabled for development or explicit self-hosted opt-in.
  const user = await establishSession({
    email: email || undefined,
    emailVerified: Boolean(email),
    phone: email ? undefined : phone,
    phoneVerified: !email && Boolean(phone),
    supabaseId,
  });
  log("info", "User signed in", { userId: user.id });
  const pref = await db.preference.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ ok: true, onboarded: Boolean(pref?.onboarded) });
}
