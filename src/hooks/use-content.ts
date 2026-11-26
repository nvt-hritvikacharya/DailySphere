"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { DailyBundle, Weather } from "@/lib/types";
import type { FeedArticle } from "@/lib/services/feed-types";

export type FeedType = "home" | "foryou" | "trending";
type FeedResponse = { date: string; articles: FeedArticle[]; topCategories?: string[] };

export function useFeed(type: FeedType) {
  return useQuery({ queryKey: ["feed", type], queryFn: () => api<FeedResponse>(`/api/feed?type=${type}`) });
}

export function useDaily() {
  return useQuery({ queryKey: ["daily"], queryFn: () => api<DailyBundle>("/api/daily"), staleTime: 30 * 60_000 });
}

export function useWeather(coords: { lat: number; lon: number } | null, ready: boolean) {
  return useQuery({
    queryKey: ["weather", coords?.lat.toFixed(1), coords?.lon.toFixed(1)],
    queryFn: () => api<Weather>(coords ? `/api/weather?lat=${coords.lat}&lon=${coords.lon}` : "/api/weather"),
    enabled: ready,
    staleTime: 20 * 60_000,
  });
}

function patchArticle(qc: ReturnType<typeof useQueryClient>, id: string, patch: Partial<FeedArticle>) {
  qc.setQueriesData<FeedResponse>({ queryKey: ["feed"] }, (old) =>
    old ? { ...old, articles: old.articles.map((a) => (a.id === id ? { ...a, ...patch } : a)) } : old,
  );
}

export function useArticleActions() {
  const qc = useQueryClient();

  const like = useMutation({
    mutationFn: (a: FeedArticle) =>
      api<{ liked: boolean; likes: number }>("/api/likes", { method: "POST", json: { articleId: a.id, title: a.title, category: a.category } }),
    onMutate: (a) => patchArticle(qc, a.id, { liked: !a.liked, likes: a.likes + (a.liked ? -1 : 1) }),
    onSuccess: (r, a) => patchArticle(qc, a.id, r),
    onError: (_e, a) => {
      patchArticle(qc, a.id, { liked: a.liked, likes: a.likes });
      toast.error("Couldn't update like");
    },
  });

  const bookmark = useMutation({
    mutationFn: (a: FeedArticle) =>
      api<{ bookmarked: boolean }>("/api/bookmarks", {
        method: "POST",
        json: { type: "ARTICLE", refId: a.id, title: a.title, url: a.url, data: { image: a.image, source: a.source, summary: a.summary, category: a.category } },
      }),
    onMutate: (a) => patchArticle(qc, a.id, { bookmarked: !a.bookmarked }),
    onSuccess: (r, a) => {
      patchArticle(qc, a.id, r);
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(r.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks");
    },
    onError: (_e, a) => patchArticle(qc, a.id, { bookmarked: a.bookmarked }),
  });

  const recordRead = (a: FeedArticle) => {
    void api("/api/history", {
      method: "POST",
      json: { articleId: a.id, title: a.title, url: a.url, source: a.source, category: a.category },
    }).catch(() => undefined);
  };

  const share = async (a: { title: string; url: string }) => {
    if (navigator.share) {
      await navigator.share({ title: a.title, url: a.url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(a.url);
      toast.success("Link copied to clipboard");
    }
  };

  return { like, bookmark, recordRead, share };
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { type: "FACT" | "TRIVIA" | "WORD" | "QUOTE" | "HISTORY"; refId: string; title: string; url?: string; data?: Record<string, unknown> }) =>
      api<{ bookmarked: boolean }>("/api/bookmarks", { method: "POST", json: b }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(r.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks");
    },
  });
}
