import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const history = await db.history.findMany({ where: { userId: user.id }, orderBy: { readAt: "desc" }, take: 50 });
  return NextResponse.json({ history });
}

const schema = z.object({
  articleId: z.string().min(1),
  title: z.string().max(500),
  url: z.string().url(),
  source: z.string().optional(),
  category: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.history.create({ data: { userId: user.id, ...parsed.data } });
  return NextResponse.json({ ok: true });
}
