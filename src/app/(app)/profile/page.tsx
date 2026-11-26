"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Panel, SectionHeader } from "@/components/daily/widgets";
import { InterestPicker } from "@/components/interest-picker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { interestById } from "@/lib/interests";

type Pref = { interests: string[]; darkMode: boolean; notifyDaily: boolean; notifyTrivia: boolean; notifyBreaking: boolean };
type ProfileData = { user: { name: string | null; email: string | null; phone: string | null; role: string; timezone: string }; preference: Pref };
type H = { id: string; title: string; url: string; source: string | null; category: string | null; readAt: string };

export default function ProfilePage() {
  const qc = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => api<ProfileData>("/api/preferences") });
  const history = useQuery({ queryKey: ["history"], queryFn: () => api<{ history: H[] }>("/api/history") });
  const bookmarks = useQuery({ queryKey: ["bookmarks"], queryFn: () => api<{ bookmarks: unknown[] }>("/api/bookmarks") });
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (profile.data) setInterests(profile.data.preference.interests);
  }, [profile.data]);

  const update = useMutation({
    mutationFn: (patch: Partial<Pref>) => api("/api/preferences", { method: "PUT", json: patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!profile.data) return <div className="glass h-96 animate-pulse rounded-3xl" />;
  const { user, preference } = profile.data;
  const dirty = interests.slice().sort().join() !== preference.interests.slice().sort().join();

  const toggles: { key: keyof Pref; label: string; hint: string }[] = [
    { key: "notifyDaily", label: "Daily briefing", hint: "A nudge when your new briefing is ready at midnight." },
    { key: "notifyTrivia", label: "Trivia reminders", hint: "Remind me to play today's questions." },
    { key: "notifyBreaking", label: "Breaking news", hint: "Major stories in my interests." },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Profile" subtitle={`${user.email ?? user.phone} · ${user.timezone}${user.role === "ADMIN" ? " · Admin" : ""}`} />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Articles read", value: history.data?.history.length ?? "—" },
          { label: "Bookmarks", value: bookmarks.data?.bookmarks.length ?? "—" },
          { label: "Interests", value: preference.interests.length },
        ].map((s) => (
          <Panel key={s.label} className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-heading text-4xl font-semibold tabular-nums">{s.value}</p>
          </Panel>
        ))}
      </div>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-xl font-semibold">Your interests</h3>
            <p className="text-sm text-muted-foreground">Shapes your Home and For You feeds.</p>
          </div>
          <Button disabled={!dirty || interests.length < 1 || update.isPending} onClick={() => update.mutate({ interests }, { onSuccess: () => toast.success("Interests updated") })}>
            {update.isPending && <Loader2 className="animate-spin" />} Save interests
          </Button>
        </div>
        <InterestPicker value={interests} onChange={setInterests} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="font-heading text-xl font-semibold">Preferences</h3>
          <div className="mt-4 divide-y divide-border/60">
            <label className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block font-medium">Dark mode</span>
                <span className="text-sm text-muted-foreground">Easy on the eyes for late-night reading.</span>
              </span>
              <Switch
                checked={resolvedTheme === "dark"}
                onCheckedChange={(v) => {
                  setTheme(v ? "dark" : "light");
                  update.mutate({ darkMode: v });
                }}
              />
            </label>
            {toggles.map((t) => (
              <label key={t.key} className="flex items-center justify-between gap-4 py-4">
                <span>
                  <span className="block font-medium">{t.label}</span>
                  <span className="text-sm text-muted-foreground">{t.hint}</span>
                </span>
                <Switch checked={Boolean(preference[t.key])} onCheckedChange={(v) => update.mutate({ [t.key]: v })} />
              </label>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-semibold">Reading history</h3>
            <Button asChild variant="ghost" size="sm"><Link href="/bookmarks">Bookmarks</Link></Button>
          </div>
          {history.data?.history.length ? (
            <ul className="mt-4 space-y-1">
              {history.data.history.slice(0, 10).map((h) => (
                <li key={h.id}>
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-accent">
                    <span className="text-lg" aria-hidden>{interestById(h.category ?? "")?.emoji ?? "📰"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium">{h.title}</span>
                      <span className="text-xs text-muted-foreground">{h.source} · {timeAgo(h.readAt)}</span>
                    </span>
                    <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Articles you open with “Read more” will appear here.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
