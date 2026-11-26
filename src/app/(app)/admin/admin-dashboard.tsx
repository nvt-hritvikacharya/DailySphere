"use client";

import { Activity, BookOpen, Bookmark, Brain, Heart, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Panel, SectionHeader } from "@/components/daily/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import type { AdminStats } from "@/lib/services/admin";
import { cn } from "@/lib/utils";

const STATUS: Record<string, string> = {
  healthy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  mock: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  degraded: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  down: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export function AdminDashboard({ stats }: { stats: AdminStats }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const t = stats.totals;
  const maxReads = Math.max(1, ...stats.readsByCategory.map((r) => r.count));

  const cards = [
    { label: "Users", value: t.users, icon: Users },
    { label: "Active (7d)", value: t.activeUsers, icon: Activity },
    { label: "Reads", value: t.reads, icon: BookOpen },
    { label: "Likes", value: t.likes, icon: Heart },
    { label: "Bookmarks", value: t.bookmarks, icon: Bookmark },
    { label: "Trivia plays", value: t.triviaPlays, icon: Brain },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Admin"
        subtitle="Content analytics, provider health, users and logs."
        action={<Button variant="outline" size="sm" onClick={() => start(() => router.refresh())} disabled={pending}><RefreshCw className={cn(pending && "animate-spin")} /> Refresh</Button>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <Panel key={label} className="p-5">
            <Icon className="size-4 text-primary" />
            <p className="mt-3 font-heading text-3xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="font-heading text-xl font-semibold">Reads by category (7d)</h3>
          <div className="mt-4 space-y-3">
            {stats.readsByCategory.length ? (
              stats.readsByCategory.map((r) => (
                <div key={r.category}>
                  <div className="flex justify-between text-sm"><span>{r.category}</span><span className="tabular-nums text-muted-foreground">{r.count}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-400" style={{ width: `${(r.count / maxReads) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No reads recorded yet.</p>
            )}
          </div>
          {stats.topArticles.length > 0 && (
            <>
              <h4 className="mt-6 text-sm font-semibold">Most-read articles</h4>
              <ol className="mt-2 space-y-1 text-sm">
                {stats.topArticles.map((a, i) => (
                  <li key={i} className="flex gap-2"><span className="w-4 text-muted-foreground">{i + 1}</span><span className="flex-1 truncate">{a.title}</span><span className="tabular-nums text-muted-foreground">{a.reads}</span></li>
                ))}
              </ol>
            </>
          )}
        </Panel>

        <Panel>
          <h3 className="font-heading text-xl font-semibold">Trending topics</h3>
          <p className="text-sm text-muted-foreground">Followers and reads per interest.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.trendingTopics.map((tp) => (
              <Badge key={tp.id} variant="outline" className="rounded-full px-3 py-1 text-sm">
                {tp.label} <span className="ml-1 text-muted-foreground">{tp.followers} · {tp.reads} reads</span>
              </Badge>
            ))}
            {!stats.trendingTopics.length && <p className="text-sm text-muted-foreground">No data yet.</p>}
          </div>

          <h3 className="mt-8 font-heading text-xl font-semibold">API health (24h)</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-2">Provider</th><th>Status</th><th className="text-right">Calls</th><th className="text-right">OK</th><th className="text-right">Avg ms</th></tr>
              </thead>
              <tbody>
                {stats.apiHealth.map((p) => (
                  <tr key={p.provider} className="border-t border-border/60" title={p.lastError}>
                    <td className="py-2 font-medium">{p.provider}</td>
                    <td><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS[p.status])}>{p.status}</span></td>
                    <td className="text-right tabular-nums">{p.calls}</td>
                    <td className="text-right tabular-nums">{p.successRate}%</td>
                    <td className="text-right tabular-nums">{p.avgLatency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!stats.apiHealth.length && <p className="py-3 text-sm text-muted-foreground">No provider calls in the last 24h (everything served from cache).</p>}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="font-heading text-xl font-semibold">Users</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-2">User</th><th>Role</th><th className="text-right">Reads</th><th className="text-right">Saved</th><th className="text-right">Active</th></tr>
              </thead>
              <tbody>
                {stats.users.map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="py-2"><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email ?? u.phone}</p></td>
                    <td><Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge></td>
                    <td className="text-right tabular-nums">{u._count.history}</td>
                    <td className="text-right tabular-nums">{u._count.bookmarks}</td>
                    <td className="text-right text-xs text-muted-foreground">{timeAgo(u.lastActiveAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-heading text-xl font-semibold">Logs</h3>
          <ul className="mt-3 max-h-[420px] space-y-1 overflow-y-auto font-mono text-xs">
            {stats.logs.map((l) => (
              <li key={l.id} className="flex gap-2 rounded-lg px-2 py-1.5 odd:bg-muted/40">
                <span className={cn("w-10 shrink-0 font-semibold uppercase", l.level === "error" ? "text-rose-500" : l.level === "warn" ? "text-amber-500" : "text-sky-500")}>{l.level}</span>
                <span className="flex-1 break-words">{l.message}{l.context ? <span className="text-muted-foreground"> {JSON.stringify(l.context)}</span> : null}</span>
                <span className="shrink-0 text-muted-foreground">{timeAgo(l.createdAt)}</span>
              </li>
            ))}
            {!stats.logs.length && <li className="text-muted-foreground">No logs yet.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
