import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "@/lib/auth/token";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/cron", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF: reject cross-site writes. Behind a hosting proxy the Host header may not match the public
  // origin, so trust the browser's Sec-Fetch-Site and only fall back to Origin vs Host without it.
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const site = req.headers.get("sec-fetch-site");
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const crossSite = site ? site === "cross-site" : Boolean(origin && host && new URL(origin).host !== host);
    if (crossSite) {
      return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
    }
  }
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(raw);

  if (!session) {
    if (isPublic) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = raw ? "?expired=1" : "";
    const res = NextResponse.redirect(url);
    if (raw) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));

  // Sliding inactivity window: every authenticated request pushes expiry out by another hour.
  const res = NextResponse.next();
  if (Date.now() - session.la > 60_000) {
    res.cookies.set(SESSION_COOKIE, await signSession({ ...session, la: Date.now() }), sessionCookieOptions);
  }
  return res;
}

export const config = {
  // Session verification may read the signing key from the database, which needs Node (not edge).
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
