import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/token";
import { getSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await getSupabase();
  await supabase?.auth.signOut().catch(() => undefined);
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
