import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/services/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json(await getAdminStats());
}
