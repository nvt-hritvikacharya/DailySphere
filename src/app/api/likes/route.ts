import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { interestCategory } from "@/lib/validation";

const MAX_LIKES = 2000;

const schema = z.object({
  articleId: z.string().trim().min(1).max(100),
  title: z.string().trim().max(300),
  category: interestCategory,
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!rateLimit(`write:${user.id}`, 120, 60_000) || !rateLimit(`likes:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { articleId, title, category } = parsed.data;
  const where = { userId_articleId: { userId: user.id, articleId } };
  const existing = await db.like.findUnique({ where });
  if (existing) await db.like.delete({ where });
  else {
    if ((await db.like.count({ where: { userId: user.id } })) >= MAX_LIKES) {
      return NextResponse.json({ error: "Like limit reached" }, { status: 400 });
    }
    await db.like.create({ data: { userId: user.id, articleId, title, category } });
  }
  const likes = await db.like.count({ where: { articleId } });
  return NextResponse.json({ liked: !existing, likes });
}
