import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const bookmarks = await db.bookmark.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ bookmarks });
}

const schema = z.object({
  type: z.enum(["ARTICLE", "FACT", "TRIVIA", "WORD", "QUOTE", "HISTORY"]),
  refId: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  url: z.string().url().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Toggles a bookmark; returns the new state. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid bookmark" }, { status: 400 });
  const { type, refId, title, url, data } = parsed.data;
  const where = { userId_type_refId: { userId: user.id, type, refId } };
  const existing = await db.bookmark.findUnique({ where });
  if (existing) {
    await db.bookmark.delete({ where });
    return NextResponse.json({ bookmarked: false });
  }
  await db.bookmark.create({
    data: { userId: user.id, type, refId, title, url, data: data as Prisma.InputJsonValue | undefined },
  });
  return NextResponse.json({ bookmarked: true });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.bookmark.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
