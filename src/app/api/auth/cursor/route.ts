import { NextResponse } from "next/server";
import { getIdentity } from "../../../../../cursor/identity";
import { establishSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { authMode } from "@/lib/env";
import { log } from "@/lib/logger";

/** Signs in the viewer the Cursor app gate already verified (private/team apps). */
export async function POST(request: Request) {
  if (authMode() !== "cursor") return NextResponse.json({ error: "Cursor sign-in is not enabled" }, { status: 404 });
  const identity = await getIdentity(request);
  if (!identity.verified || identity.kind !== "person") {
    return NextResponse.json({ error: "Open this app through its Cursor link to sign in." }, { status: 401 });
  }

  const teamAdmin = identity.appVisibility === "team" && identity.teamRole === "admin";
  // A private app opens only for its owner and people they invite; the first to sign in runs it.
  const firstPrivateUser = identity.appVisibility === "private" && (await db.user.count({ where: { role: "ADMIN" } })) === 0;

  const user = await establishSession({
    cursorSub: identity.sub,
    email: identity.email || undefined,
    emailVerified: identity.emailVerified,
    name: identity.name || undefined,
    grantAdmin: teamAdmin || firstPrivateUser,
  });
  log("info", "User signed in", { userId: user.id, via: "cursor" });
  const pref = await db.preference.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ ok: true, onboarded: Boolean(pref?.onboarded) }, { headers: { "Cache-Control": "private, no-store" } });
}
