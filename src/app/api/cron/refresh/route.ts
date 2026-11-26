import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runDailyRefresh } from "@/lib/services/refresh";

export const maxDuration = 300;

async function handle(req: Request) {
  const auth = req.headers.get("authorization");
  if (!env.cronSecret || auth !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runDailyRefresh());
}

export { handle as GET, handle as POST };
