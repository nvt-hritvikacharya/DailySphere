import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { httpUrl } from "@/lib/validation";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const history = await db.history.findMany({ where: { userId: user.id }, orderBy: { readAt: "desc" }, take: 50 });
  return NextResponse.json({ history });
}

const schema = z.object({
  articleId: z.string().min(1).max(100),
  title: z.string().max(500),
  url: httpUrl,
  source: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!rateLimit(`write:${user.id}`, 120, 60_000)) return NextResponse.json({ error: "Slow down" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.history.create({ data: { userId: user.id, ...parsed.data } });
  return NextResponse.json({ ok: true });
}
