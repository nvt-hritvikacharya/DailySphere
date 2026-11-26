import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

const schema = z.object({ articleId: z.string().min(1), title: z.string().max(500), category: z.string().optional() });

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { articleId, title, category } = parsed.data;
  const where = { userId_articleId: { userId: user.id, articleId } };
  const existing = await db.like.findUnique({ where });
  if (existing) await db.like.delete({ where });
  else await db.like.create({ data: { userId: user.id, articleId, title, category } });
  const likes = await db.like.count({ where: { articleId } });
  return NextResponse.json({ liked: !existing, likes });
}
