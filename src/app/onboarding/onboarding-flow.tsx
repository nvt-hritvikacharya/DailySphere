"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InterestPicker } from "@/components/interest-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export function OnboardingFlow({ initial, name: initialName }: { initial: string[]; name: string }) {
  const [interests, setInterests] = useState(initial);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api("/api/preferences", {
        method: "PUT",
        json: { interests, onboarded: true, name: name.trim() || undefined, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      window.location.assign("/");
    } catch (e) {
      toast.error((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 pb-32 sm:py-16">
      <p className="text-sm font-medium tracking-widest text-primary uppercase">Welcome to DailySphere</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">What should your daily briefing cover?</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Pick at least three topics. You can change these anytime from your profile.</p>

      <div className="mt-8 max-w-sm space-y-2">
        <label htmlFor="name" className="text-sm font-medium">What should we call you?</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11" maxLength={60} />
      </div>

      <div className="mt-8">
        <InterestPicker value={interests} onChange={setInterests} />
      </div>

      <div className="glass fixed inset-x-0 bottom-0 border-x-0 border-b-0 px-5 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{interests.length}</span> selected
            {interests.length < 3 && ` · pick ${3 - interests.length} more`}
          </p>
          <Button size="lg" disabled={interests.length < 3 || saving} onClick={save}>
            {saving ? <Loader2 className="animate-spin" /> : null} Build my feed <ArrowRight />
          </Button>
        </div>
      </div>
    </main>
  );
}
