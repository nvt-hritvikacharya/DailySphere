"use client";

import { HistoryTimeline, Panel, SectionHeader } from "@/components/daily/widgets";
import { useDaily } from "@/hooks/use-content";

export default function OnThisDayPage() {
  const { data, isLoading } = useDaily();
  const label = data
    ? new Date(`${data.date}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric" })
    : "";
  return (
    <div>
      <SectionHeader title={`Today in History${label ? ` · ${label}` : ""}`} subtitle="Ten moments that happened on this date, across the centuries." />
      <Panel>
        {isLoading || !data ? (
          <div className="space-y-6">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : (
          <HistoryTimeline events={data.history} limit={10} />
        )}
      </Panel>
    </div>
  );
}
