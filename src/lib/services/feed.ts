import "server-only";
import { db } from "../db";
import { getFeed, getTrending } from "../providers/news";
import type { Article } from "../types";
import type { FeedArticle } from "./feed-types";

async function engagementMap(since: Date) {
  const [likes, reads] = await Promise.all([
    db.like.groupBy({ by: ["articleId"], _count: true, where: { createdAt: { gte: since } } }),
    db.history.groupBy({ by: ["articleId"], _count: true, where: { readAt: { gte: since } } }),
  ]);
  const m = new Map<string, number>();
  for (const l of likes) m.set(l.articleId, (m.get(l.articleId) ?? 0) + l._count * 2);
  for (const r of reads) m.set(r.articleId, (m.get(r.articleId) ?? 0) + r._count);
  return m;
}

async function decorate(userId: string, articles: Article[]): Promise<FeedArticle[]> {
  const ids = articles.map((a) => a.id);
  const [likes, bookmarks, counts] = await Promise.all([
    db.like.findMany({ where: { userId, articleId: { in: ids } }, select: { articleId: true } }),
    db.bookmark.findMany({ where: { userId, type: "ARTICLE", refId: { in: ids } }, select: { refId: true } }),
    db.like.groupBy({ by: ["articleId"], _count: true, where: { articleId: { in: ids } } }),
  ]);
  const liked = new Set(likes.map((l) => l.articleId));
  const saved = new Set(bookmarks.map((b) => b.refId));
  const countMap = new Map(counts.map((c) => [c.articleId, c._count]));
  return articles.map((a) => ({ ...a, liked: liked.has(a.id), bookmarked: saved.has(a.id), likes: countMap.get(a.id) ?? 0 }));
}

export async function homeFeed(userId: string, interests: string[], dateKey: string) {
  return decorate(userId, (await getFeed(interests, dateKey)).slice(0, 24));
}

/**
 * For You: weights the user's chosen interests by what they actually read and like,
 * then drops articles they've already opened.
 */
export async function forYouFeed(userId: string, interests: string[], dateKey: string) {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [history, likes] = await Promise.all([
    db.history.groupBy({ by: ["category"], _count: true, where: { userId, readAt: { gte: since } } }),
    db.like.groupBy({ by: ["category"], _count: true, where: { userId, createdAt: { gte: since } } }),
  ]);
  const weight = new Map<string, number>(interests.map((i) => [i, 1]));
  for (const h of history) if (h.category) weight.set(h.category, (weight.get(h.category) ?? 0) + h._count * 0.5);
  for (const l of likes) if (l.category) weight.set(l.category, (weight.get(l.category) ?? 0) + l._count);
  const ranked = [...weight.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 8);

  const read = new Set(
    (await db.history.findMany({ where: { userId }, select: { articleId: true }, take: 500, orderBy: { readAt: "desc" } })).map(
      (h) => h.articleId,
    ),
  );
  const articles = (await getFeed(ranked, dateKey)).filter((a) => !read.has(a.id)).slice(0, 30);
  return { articles: await decorate(userId, articles), topCategories: ranked.slice(0, 4) };
}

export async function trendingFeed(userId: string, dateKey: string) {
  const engagement = await engagementMap(new Date(Date.now() - 2 * 86_400_000));
  return decorate(userId, await getTrending(dateKey, engagement));
}
