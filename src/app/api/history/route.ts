import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { httpUrl, interestCategory } from "@/lib/validation";

/** Only the most recent reads are kept per user. */
const MAX_HISTORY = 500;

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const history = await db.history.findMany({ where: { userId: user.id }, orderBy: { readAt: "desc" }, take: 50 });
  return NextResponse.json({ history });
}

const schema = z.object({
  articleId: z.string().trim().min(1).max(100),
  title: z.string().trim().max(300),
  url: httpUrl,
  source: z.string().trim().max(100).nullish(),
  category: interestCategory,
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!rateLimit(`write:${user.id}`, 120, 60_000) || !rateLimit(`history:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.history.create({ data: { userId: user.id, ...parsed.data, source: parsed.data.source ?? null } });

  const cutoff = await db.history.findFirst({
    where: { userId: user.id },
    orderBy: { readAt: "desc" },
    skip: MAX_HISTORY,
    select: { readAt: true },
  });
  if (cutoff) await db.history.deleteMany({ where: { userId: user.id, readAt: { lte: cutoff.readAt } } });
  return NextResponse.json({ ok: true });
}
