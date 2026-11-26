import { cached } from "../cache";
import { env } from "../env";
import { hashString } from "../dates";
import { interestById, INTEREST_IDS } from "../interests";
import { fetchJson, withProvider } from "../logger";
import type { Article } from "../types";
import { MOCK_HEADLINES } from "./mock-data";
import { extractiveSummary, summarize } from "./summary";

type RawArticle = {
  title: string;
  description?: string;
  content?: string;
  url: string;
  image?: string | null;
  source: string;
  publishedAt: string;
};

const TRENDING_POOL = ["technology", "ai", "business", "science", "sports", "politics", "health", "space"];

const articleId = (url: string) => hashString(url).toString(36);

function placeholderImage(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/500`;
}

function mockRaw(category: string, dateKey: string): RawArticle[] {
  const list = MOCK_HEADLINES[category] ?? MOCK_HEADLINES.technology;
  const base = new Date(`${dateKey}T09:00:00Z`).getTime();
  return list.map((h, i) => ({
    title: h.title,
    description: `${h.title}: ${h.blurb}.`,
    url: `https://example.com/${category}/${dateKey}/${i}`,
    image: placeholderImage(`${category}-${i}-${dateKey}`),
    source: h.source,
    publishedAt: new Date(base - i * 47 * 60_000).toISOString(),
  }));
}

async function fetchGNews(category: string): Promise<RawArticle[]> {
  const q = interestById(category)?.query ?? category;
  type R = { articles: { title: string; description: string; content: string; url: string; image: string; publishedAt: string; source: { name: string } }[] };
  const data = await fetchJson<R>(
    `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&sortby=publishedAt&apikey=${env.gnewsKey}`,
  );
  return data.articles.map((a) => ({ ...a, source: a.source.name }));
}

async function fetchNewsApi(category: string): Promise<RawArticle[]> {
  const q = interestById(category)?.query ?? category;
  type R = { articles: { title: string; description: string; content: string; url: string; urlToImage: string | null; publishedAt: string; source: { name: string } }[] };
  const data = await fetchJson<R>(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&pageSize=10&sortBy=publishedAt`,
    { headers: { "X-Api-Key": env.newsApiKey } },
  );
  return data.articles
    .filter((a) => a.title && a.title !== "[Removed]")
    .map((a) => ({ ...a, image: a.urlToImage, source: a.source.name }));
}

function liveFetcher(): { name: string; fn: (c: string) => Promise<RawArticle[]> } | null {
  if (env.useMocks) return null;
  if (env.gnewsKey) return { name: "gnews", fn: fetchGNews };
  if (env.newsApiKey) return { name: "newsapi", fn: fetchNewsApi };
  return null;
}

/** Articles for one interest, cached for the user-local day (refreshed every 3h within the day). */
export async function getCategoryNews(category: string, dateKey: string): Promise<Article[]> {
  return cached(`news:${category}:${dateKey}`, { kind: "news", date: dateKey, ttlSeconds: 3 * 3600 }, async () => {
    const live = liveFetcher();
    const raw = await withProvider(
      live?.name ?? "news-mock",
      live ? async () => {
        const r = await live.fn(category);
        if (!r.length) throw new Error("no articles");
        return r;
      } : null,
      () => mockRaw(category, dateKey),
    );
    const isMock = !live;
    return Promise.all(
      raw.slice(0, 8).map(async (a) => ({
        id: articleId(a.url),
        title: a.title,
        image: a.image || placeholderImage(a.url),
        source: a.source,
        url: a.url,
        publishedAt: a.publishedAt,
        category,
        summary: isMock
          ? extractiveSummary({ ...a, category: interestById(category)?.label ?? category })
          : await summarize({ ...a, category: interestById(category)?.label ?? category }),
      })),
    );
  });
}

function interleave(lists: Article[][]): Article[] {
  const out: Article[] = [];
  const seen = new Set<string>();
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const l of lists) {
      const a = l[i];
      if (a && !seen.has(a.id)) {
        seen.add(a.id);
        out.push(a);
      }
    }
  }
  return out;
}

export async function getFeed(interests: string[], dateKey: string): Promise<Article[]> {
  const cats = interests.length ? interests : ["technology", "science", "business", "sports"];
  const lists = await Promise.all(cats.map((c) => getCategoryNews(c, dateKey)));
  return interleave(lists);
}

/**
 * Trending: top 20 across all categories, ranked by in-app engagement (likes + reads)
 * with recency as the tiebreaker.
 */
export async function getTrending(dateKey: string, engagement: Map<string, number>): Promise<Article[]> {
  // With a live key, limit the pool to keep within free-tier quotas (each category = 1 call per 3h).
  const pool = liveFetcher() ? TRENDING_POOL : INTEREST_IDS;
  const lists = await Promise.all(pool.map((c) => getCategoryNews(c, dateKey)));
  const all = interleave(lists);
  return all
    .map((a) => ({ a, score: (engagement.get(a.id) ?? 0) * 10 + new Date(a.publishedAt).getTime() / 3.6e6 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 20)
    .map((x) => x.a);
}
