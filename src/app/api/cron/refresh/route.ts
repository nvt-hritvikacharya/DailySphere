import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runDailyRefresh } from "@/lib/services/refresh";

export const maxDuration = 300;

const digest = (s: string) => createHash("sha256").update(s).digest();

async function handle(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!env.cronSecret || !timingSafeEqual(digest(auth), digest(`Bearer ${env.cronSecret}`))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runDailyRefresh());
}

export { handle as GET, handle as POST };
