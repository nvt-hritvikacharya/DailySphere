import "server-only";
import { db } from "../db";
import { interestById } from "../interests";

export async function getAdminStats() {
  const dayAgo = new Date(Date.now() - 86_400_000);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [users, activeUsers, bookmarks, likes, reads, triviaPlays, prefs, readsByCategory, topArticles, apiLogs, logs, recentUsers] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { lastActiveAt: { gte: weekAgo } } }),
      db.bookmark.count(),
      db.like.count(),
      db.history.count(),
      db.triviaScore.count(),
      db.preference.findMany({ select: { interests: true } }),
      db.history.groupBy({ by: ["category"], _count: true, where: { readAt: { gte: weekAgo } } }),
      db.history.groupBy({
        by: ["articleId", "title", "source"],
        _count: true,
        where: { readAt: { gte: weekAgo } },
        orderBy: { _count: { articleId: "desc" } },
        take: 8,
      }),
      db.apiLog.findMany({ where: { createdAt: { gte: dayAgo } }, select: { provider: true, ok: true, latencyMs: true, fallback: true, error: true, createdAt: true } }),
      db.appLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, lastActiveAt: true, _count: { select: { history: true, bookmarks: true } } },
      }),
    ]);

  const interestCounts = new Map<string, number>();
  for (const p of prefs) for (const i of p.interests) interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1);
  const trendingTopics = [...interestCounts.entries()]
    .map(([id, followers]) => ({
      id,
      label: interestById(id)?.label ?? id,
      followers,
      reads: readsByCategory.find((r) => r.category === id)?._count ?? 0,
    }))
    .sort((a, b) => b.reads + b.followers - (a.reads + a.followers))
    .slice(0, 10);

  const providers = new Map<string, { calls: number; ok: number; fallback: number; latency: number; lastError?: string }>();
  for (const l of apiLogs) {
    const p = providers.get(l.provider) ?? { calls: 0, ok: 0, fallback: 0, latency: 0 };
    p.calls++;
    if (l.ok) p.ok++;
    if (l.fallback) p.fallback++;
    p.latency += l.latencyMs;
    if (!l.ok && l.error) p.lastError = l.error;
    providers.set(l.provider, p);
  }
  const apiHealth = [...providers.entries()].map(([provider, p]) => ({
    provider,
    calls: p.calls,
    successRate: Math.round((p.ok / p.calls) * 100),
    fallbackRate: Math.round((p.fallback / p.calls) * 100),
    avgLatency: Math.round(p.latency / Math.max(1, p.calls)),
    lastError: p.lastError,
    status: p.ok === p.calls && p.fallback === 0 ? "healthy" : p.ok === p.calls ? "mock" : p.ok / p.calls > 0.8 ? "degraded" : "down",
  }));

  return {
    totals: { users, activeUsers, bookmarks, likes, reads, triviaPlays },
    readsByCategory: readsByCategory
      .map((r) => ({ category: interestById(r.category ?? "")?.label ?? r.category ?? "Other", count: r._count }))
      .sort((a, b) => b.count - a.count),
    topArticles: topArticles.map((a) => ({ title: a.title, source: a.source, reads: a._count })),
    trendingTopics,
    apiHealth,
    logs,
    users: recentUsers,
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
