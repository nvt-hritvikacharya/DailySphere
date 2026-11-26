import { NextResponse } from "next/server";
import { getTodayKey, requireUser } from "@/lib/auth/session";
import { forYouFeed, homeFeed, trendingFeed } from "@/lib/services/feed";

export async function GET(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const type = new URL(req.url).searchParams.get("type") ?? "home";
  const date = await getTodayKey();
  const interests = user.preference?.interests ?? [];

  if (type === "trending") return NextResponse.json({ date, articles: await trendingFeed(user.id, date) });
  if (type === "foryou") return NextResponse.json({ date, ...(await forYouFeed(user.id, interests, date)) });
  return NextResponse.json({ date, articles: await homeFeed(user.id, interests, date) });
}
