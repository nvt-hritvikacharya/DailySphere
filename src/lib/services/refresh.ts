import { db } from "../db";
import { localDateKey } from "../dates";
import { log } from "../logger";
import { getDailyBundle, getTriviaWithAnswers } from "../providers/daily";
import { getCategoryNews } from "../providers/news";

/**
 * Scheduled job (run hourly). For every time zone that has users, it pre-warms that zone's
 * "today" content — so the first request after local midnight is instant — creates the daily
 * briefing notification, and purges expired cache rows and old logs.
 */
export async function runDailyRefresh() {
  const started = Date.now();
  const zones = await db.user.groupBy({ by: ["timezone"] });
  const dates = new Set(zones.map((z) => localDateKey(z.timezone)));
  dates.add(localDateKey("UTC"));

  const prefs = await db.preference.findMany({ select: { interests: true } });
  const categories = new Set(prefs.flatMap((p) => p.interests));

  for (const date of dates) {
    await getDailyBundle(date);
    await getTriviaWithAnswers(date);
    await Promise.all([...categories].map((c) => getCategoryNews(c, date)));
  }

  let notified = 0;
  const users = await db.user.findMany({ select: { id: true, timezone: true, preference: true } });
  for (const u of users) {
    if (!u.preference?.notifyDaily) continue;
    const date = localDateKey(u.timezone);
    const title = `Your briefing for ${date} is ready`;
    const exists = await db.notification.findFirst({ where: { userId: u.id, title } });
    if (exists) continue;
    await db.notification.create({
      data: {
        userId: u.id,
        title,
        body: u.preference.notifyTrivia
          ? "Fresh stories, a new word, and 5 trivia questions are waiting for you."
          : "Fresh stories picked for your interests are waiting for you.",
      },
    });
    notified++;
  }

  const now = new Date();
  const purgedCache = await db.cachedContent.deleteMany({ where: { expiresAt: { lt: now } } });
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  await db.apiLog.deleteMany({ where: { createdAt: { lt: monthAgo } } });
  await db.appLog.deleteMany({ where: { createdAt: { lt: monthAgo } } });

  const summary = { dates: [...dates], categories: categories.size, notified, purgedCache: purgedCache.count, ms: Date.now() - started };
  log("info", "Daily refresh completed", summary);
  return summary;
}
