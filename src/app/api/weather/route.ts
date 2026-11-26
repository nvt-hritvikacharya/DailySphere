import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getWeather } from "@/lib/providers/weather";

export async function GET(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const p = new URL(req.url).searchParams;
  const lat = p.get("lat") ? Number(p.get("lat")) : undefined;
  const lon = p.get("lon") ? Number(p.get("lon")) : undefined;
  const valid = lat !== undefined && lon !== undefined && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  return NextResponse.json(await getWeather(valid ? lat : undefined, valid ? lon : undefined));
}
