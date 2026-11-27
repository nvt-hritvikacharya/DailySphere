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

type Identity = {
  email?: string;
  /** True only when the identity provider proved the viewer controls this email. */
  emailVerified?: boolean;
  phone?: string;
  /** True only when the identity provider proved the viewer controls this phone number. */
  phoneVerified?: boolean;
  supabaseId?: string;
  cursorSub?: string;
  name?: string;
  grantAdmin?: boolean;
};

type UserRow = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>;

/**
 * An existing account may be claimed by email/phone only when that row is not already bound to a
 * different identity of the same provider; provider-less (demo) sign-ins only match unbound rows.
 */
function canLink(row: UserRow, identity: Identity) {
  if (identity.cursorSub) return row.cursorSub === null;
  if (identity.supabaseId) return row.supabaseId === null;
  return row.cursorSub === null && row.supabaseId === null;
}

/** Find or create the app user for a verified identity and issue the app session cookie. */
export async function establishSession(identity: Identity) {
  const store = await cookies();
  const tz = safeTimeZone(store.get(TZ_COOKIE)?.value);
  const email = identity.emailVerified && identity.email ? identity.email.toLowerCase() : undefined;
  const phone = identity.phoneVerified && identity.phone ? identity.phone : undefined;
  const handle = email ?? phone ?? "";
  const isAdmin = Boolean(identity.grantAdmin) || (handle !== "" && env.adminEmails.includes(handle.toLowerCase()));

  let existing: UserRow | null = identity.cursorSub
    ? await db.user.findUnique({ where: { cursorSub: identity.cursorSub } })
    : identity.supabaseId
      ? await db.user.findUnique({ where: { supabaseId: identity.supabaseId } })
      : null;

  let emailTaken = false;
  let phoneTaken = false;
  if (!existing && email) {
    const row = await db.user.findUnique({ where: { email } });
    if (row && canLink(row, identity)) existing = row;
    else emailTaken = Boolean(row);
  }
  if (!existing && phone) {
    const row = await db.user.findUnique({ where: { phone } });
    if (row && canLink(row, identity)) existing = row;
    else phoneTaken = Boolean(row);
  }

  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: {
          supabaseId: existing.supabaseId ?? identity.supabaseId,
          cursorSub: existing.cursorSub ?? identity.cursorSub,
          timezone: tz,
          lastActiveAt: new Date(),
          ...(isAdmin ? { role: "ADMIN" as const } : {}),
        },
      })
    : await db.user.create({
        data: {
          // Unverified or already-claimed contacts are not stored, so they can't block or hijack the real owner.
          email: emailTaken ? undefined : email,
          phone: phoneTaken ? undefined : phone,
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
