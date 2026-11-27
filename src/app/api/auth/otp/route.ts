import { NextResponse } from "next/server";
import { z } from "zod";
import { authMode } from "@/lib/env";
import { log } from "@/lib/logger";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase/server";

const schema = z.union([
  z.object({ email: z.string().email().max(254) }),
  z.object({ phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +919876543210") }),
]);

export async function POST(req: Request) {
  if (!rateLimit(`otp:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const target = "email" in parsed.data ? parsed.data.email.toLowerCase() : parsed.data.phone;
  if (!rateLimit(`otp:${target}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many codes requested for this address. Try again later." }, { status: 429 });
  }

  const mode = authMode();
  if (mode === "demo") {
    log("info", "Demo OTP issued");
    return NextResponse.json({ ok: true, demo: true });
  }
  if (mode !== "supabase") return NextResponse.json({ error: "Code sign-in is not enabled" }, { status: 404 });

  const supabase = (await getSupabase())!;
  const { error } = await supabase.auth.signInWithOtp(
    "email" in parsed.data
      ? { email: parsed.data.email, options: { shouldCreateUser: true } }
      : { phone: parsed.data.phone, options: { shouldCreateUser: true } },
  );
  if (error) {
    log("warn", "Supabase OTP send failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, demo: false });
}
