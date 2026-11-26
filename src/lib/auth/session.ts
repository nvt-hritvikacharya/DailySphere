import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "../db";
import { localDateKey, safeTimeZone } from "../dates";
import { env } from "../env";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./token";

export const TZ_COOKIE = "ds_tz";

export async function getTimeZone() {
  const store = await cookies();
  return safeTimeZone(store.get(TZ_COOKIE)?.value);
}

export async function getTodayKey() {
  return localDateKey(await getTimeZone());
}

export async function getSessionUser() {
  const store = await cookies();
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return db.user.findUnique({ where: { id: payload.uid }, include: { preference: true } });
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

/** For route handlers: returns the user or a 401 response. */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

/** Find or create the app user for a verified identity and issue the app session cookie. */
export async function establishSession(identity: {
  email?: string;
  phone?: string;
  supabaseId?: string;
  cursorSub?: string;
  name?: string;
  grantAdmin?: boolean;
}) {
  const store = await cookies();
  const tz = safeTimeZone(store.get(TZ_COOKIE)?.value);
  const handle = (identity.email ?? identity.phone ?? "").toLowerCase();
  const isAdmin = Boolean(identity.grantAdmin) || (handle !== "" && env.adminEmails.includes(handle));

  const where = identity.cursorSub
    ? { cursorSub: identity.cursorSub }
    : identity.supabaseId
    ? { supabaseId: identity.supabaseId }
    : identity.email
      ? { email: identity.email.toLowerCase() }
      : { phone: identity.phone! };

  const existing =
    (await db.user.findUnique({ where })) ??
    (identity.email ? await db.user.findUnique({ where: { email: identity.email.toLowerCase() } }) : null) ??
    (identity.phone ? await db.user.findUnique({ where: { phone: identity.phone } }) : null);

  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: {
          supabaseId: identity.supabaseId ?? existing.supabaseId,
          cursorSub: identity.cursorSub ?? existing.cursorSub,
          timezone: tz,
          lastActiveAt: new Date(),
          ...(isAdmin ? { role: "ADMIN" as const } : {}),
        },
      })
    : await db.user.create({
        data: {
          email: identity.email?.toLowerCase(),
          phone: identity.phone,
          supabaseId: identity.supabaseId,
          cursorSub: identity.cursorSub,
          name: identity.name || (identity.email ? identity.email.split("@")[0] : `Reader ${identity.phone?.slice(-4) ?? ""}`),
          role: isAdmin ? "ADMIN" : "USER",
          timezone: tz,
          preference: { create: { interests: [] } },
        },
      });

  const token = await signSession({ uid: user.id, role: user.role, la: Date.now() });
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
  return user;
}
