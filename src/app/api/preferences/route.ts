import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { INTEREST_IDS } from "@/lib/interests";
import { safeTimeZone } from "@/lib/dates";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, timezone: user.timezone },
    preference: user.preference,
  });
}

const schema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  timezone: z.string().max(64).optional(),
  interests: z.array(z.enum(INTEREST_IDS as [string, ...string[]])).min(1).max(INTEREST_IDS.length).transform((ids) => [...new Set(ids)]).optional(),
  onboarded: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  notifyDaily: z.boolean().optional(),
  notifyTrivia: z.boolean().optional(),
  notifyBreaking: z.boolean().optional(),
});

export async function PUT(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!rateLimit(`write:${user.id}`, 120, 60_000)) return NextResponse.json({ error: "Slow down" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const { name, timezone, ...prefs } = parsed.data;
  if (name || timezone) {
    await db.user.update({
      where: { id: user.id },
      data: { ...(name ? { name } : {}), ...(timezone ? { timezone: safeTimeZone(timezone) } : {}) },
    });
  }
  const preference = await db.preference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, interests: prefs.interests ?? [], ...prefs },
    update: prefs,
  });
  return NextResponse.json({ preference });
}
