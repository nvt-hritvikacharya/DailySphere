import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({ notifications, unread: notifications.filter((n) => !n.read).length });
}

export async function PATCH() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
