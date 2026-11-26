"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FactCard, QuoteCard, SectionHeader, WeatherWidget, WordCard } from "@/components/daily/widgets";
import { ArticleCard, ArticleSkeleton } from "@/components/news/article-card";
import { Button } from "@/components/ui/button";
import { useDaily, useFeed, useWeather } from "@/hooks/use-content";
import { greeting } from "@/lib/format";

function useCoords() {
  const [state, setState] = useState<{ coords: { lat: number; lon: number } | null; ready: boolean }>({ coords: null, ready: false });
  useEffect(() => {
    if (!navigator.geolocation) return setState({ coords: null, ready: true });
    const timer = setTimeout(() => setState((s) => (s.ready ? s : { coords: null, ready: true })), 3000);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(timer);
        setState({ coords: { lat: p.coords.latitude, lon: p.coords.longitude }, ready: true });
      },
      () => {
        clearTimeout(timer);
        setState({ coords: null, ready: true });
      },
      { maximumAge: 30 * 60_000, timeout: 3000 },
    );
    return () => clearTimeout(timer);
  }, []);
  return state;
}

export function HomeView({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const { coords, ready } = useCoords();
  const weather = useWeather(coords, ready);
  const feed = useFeed("home");
  const daily = useDaily();
  const [hero, ...rest] = feed.data?.articles ?? [];

  return (
    <div className="space-y-12">
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium tracking-widest text-primary uppercase" suppressHydrationWarning>
            {now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) ?? "\u00a0"}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl" suppressHydrationWarning>
            {`${now ? greeting(now) : "Hello"}, ${name.split(" ")[0]}.`}
          </h1>
          <p className="mt-2 text-muted-foreground">Here&apos;s your briefing for today.</p>
        </div>
        <WeatherWidget weather={weather.data} loading={!ready || weather.isLoading} />
      </section>

      <section>
        <SectionHeader title="Top stories for you" subtitle="Summarized from your interests — tap Read more for the full story." />
        {feed.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-3"><ArticleSkeleton /></div>
            {Array.from({ length: 3 }).map((_, i) => <ArticleSkeleton key={i} />)}
          </div>
        ) : feed.isError ? (
          <p className="text-muted-foreground">Couldn&apos;t load your feed. Please refresh.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hero && <div className="md:col-span-2 lg:col-span-3"><ArticleCard article={hero} variant="hero" /></div>}
            {rest.slice(0, 6).map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
          </div>
        )}
      </section>

      {daily.data && (
        <section>
          <SectionHeader
            title="Today's knowledge"
            action={<Button asChild variant="ghost" size="sm"><Link href="/discover">See all <ArrowRight /></Link></Button>}
          />
          <div className="grid gap-6 md:grid-cols-3">
            <WordCard word={daily.data.word} />
            <QuoteCard quote={daily.data.quote} delay={0.05} />
            <FactCard fact={daily.data.fact} delay={0.1} />
          </div>
        </section>
      )}

      {rest.length > 6 && (
        <section>
          <SectionHeader title="More to read" />
          <div className="grid gap-4 lg:grid-cols-2">
            {rest.slice(6, 16).map((a, i) => <ArticleCard key={a.id} article={a} variant="compact" index={i} />)}
          </div>
        </section>
      )}

      <section className="glass flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-r from-violet-500/15 to-rose-400/15 p-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Ready for today&apos;s trivia?</h2>
          <p className="text-muted-foreground">Five questions. One shot. Climb the daily leaderboard.</p>
        </div>
        <Button asChild size="lg"><Link href="/trivia">Play now <ArrowRight /></Link></Button>
      </section>
    </div>
  );
}
