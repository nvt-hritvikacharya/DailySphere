"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FactCard, HistoryTimeline, Panel, QuoteCard, SectionHeader, WordCard } from "@/components/daily/widgets";
import { Button } from "@/components/ui/button";
import { useDaily } from "@/hooks/use-content";

export default function DiscoverPage() {
  const { data, isLoading } = useDaily();
  return (
    <div className="space-y-10">
      <SectionHeader title="Discover" subtitle="A little knowledge, every day. Resets at midnight your time." />
      {isLoading || !data ? (
        <div className="grid gap-6 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-56 animate-pulse rounded-3xl" />)}</div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <WordCard word={data.word} />
            <div className="grid gap-6">
              <QuoteCard quote={data.quote} delay={0.05} />
              <FactCard fact={data.fact} delay={0.1} />
            </div>
          </div>
          <Panel delay={0.15}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-heading text-2xl font-semibold">On this day</h3>
              <Button asChild variant="ghost" size="sm"><Link href="/on-this-day">All 10 events <ArrowRight /></Link></Button>
            </div>
            <HistoryTimeline events={data.history} limit={3} />
          </Panel>
        </>
      )}
    </div>
  );
}
