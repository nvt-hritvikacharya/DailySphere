import { NextResponse } from "next/server";
import { getTodayKey, requireUser } from "@/lib/auth/session";
import { getDailyBundle } from "@/lib/providers/daily";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json(await getDailyBundle(await getTodayKey()));
}
