"use client";

import { ArticleCard, ArticleSkeleton } from "@/components/news/article-card";
import { SectionHeader } from "@/components/daily/widgets";
import { Badge } from "@/components/ui/badge";
import { useFeed, type FeedType } from "@/hooks/use-content";
import { interestById } from "@/lib/interests";

export function FeedList({ type, title, subtitle, ranked }: { type: FeedType; title: string; subtitle: string; ranked?: boolean }) {
  const { data, isLoading, isError } = useFeed(type);
  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} />
      {data?.topCategories && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Tuned to:
          {data.topCategories.map((c) => (
            <Badge key={c} variant="outline" className="rounded-full">{interestById(c)?.emoji} {interestById(c)?.label ?? c}</Badge>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} variant="compact" />)}</div>
      ) : isError ? (
        <p className="text-muted-foreground">Couldn&apos;t load stories. Please refresh.</p>
      ) : data?.articles.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.articles.map((a, i) => <ArticleCard key={a.id} article={a} variant="compact" index={i} rank={ranked ? i + 1 : undefined} />)}
        </div>
      ) : (
        <p className="text-muted-foreground">You&apos;ve read everything here — check back after midnight for a fresh batch.</p>
      )}
    </div>
  );
}
