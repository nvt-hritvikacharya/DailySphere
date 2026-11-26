"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Check, Crown, Loader2, Trophy, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Panel, SectionHeader } from "@/components/daily/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToggleBookmark } from "@/hooks/use-content";
import { api } from "@/lib/api";
import type { TriviaQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type Q = TriviaQuestion & { answer?: string };
type Row = { rank: number; name: string; score: number; total: number; userId: string };
type TriviaData = { date: string; questions: Q[]; result: { score: number; total: number; answers: string[] } | null; leaderboard: Row[] };

export default function TriviaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["trivia"], queryFn: () => api<TriviaData>("/api/trivia") });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const save = useToggleBookmark();

  const submit = useMutation({
    mutationFn: (a: string[]) => api("/api/trivia", { method: "POST", json: { answers: a } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trivia"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading || !data) return <div className="glass h-96 animate-pulse rounded-3xl" />;

  const done = data.result;
  const q = data.questions[current];

  const choose = (opt: string) => {
    const next = [...answers];
    next[current] = opt;
    setAnswers(next);
    setTimeout(() => {
      if (current < data.questions.length - 1) setCurrent(current + 1);
      else submit.mutate(next);
    }, 350);
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Daily Trivia" subtitle="Five new questions every day. Everyone gets the same set — may the sharpest mind win." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel>
          {done ? (
            <div className="space-y-6">
              <div className="text-center">
                <Trophy className="mx-auto size-12 text-amber-500" />
                <p className="mt-3 font-heading text-5xl font-semibold tabular-nums">
                  {done.score}<span className="text-muted-foreground">/{done.total}</span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  {done.score === done.total ? "Perfect score!" : done.score >= 3 ? "Nicely done." : "Tomorrow's another chance."} Come back after midnight for new questions.
                </p>
              </div>
              <ul className="space-y-3">
                {data.questions.map((qq, i) => {
                  const right = done.answers[i] === qq.answer;
                  return (
                    <li key={qq.id} className="flex gap-3 rounded-2xl border border-border/60 p-4">
                      <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", right ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600")}>
                        {right ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{qq.question}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Answer: <span className="font-medium text-foreground">{qq.answer}</span>
                          {!right && <> · you said {done.answers[i]}</>}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Save question"
                        onClick={() => save.mutate({ type: "TRIVIA", refId: qq.id, title: qq.question, data: { answer: qq.answer, category: qq.category } })}
                      >
                        <Bookmark />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : submit.isPending ? (
            <div className="grid h-72 place-items-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
          ) : (
            q && (
              <div>
                <div className="mb-6 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                  <span>Question {current + 1} of {data.questions.length}</span>
                  <Badge variant="secondary" className="rounded-full">{q.category} · {q.difficulty}</Badge>
                </div>
                <Progress value={(current / data.questions.length) * 100} className="mb-8 h-1.5" />
                <AnimatePresence mode="wait">
                  <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="font-heading text-2xl leading-snug font-semibold text-balance sm:text-3xl">{q.question}</h3>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {q.options.map((opt) => (
                        <motion.button
                          key={opt}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => choose(opt)}
                          disabled={answers[current] !== undefined && answers.length > current}
                          className={cn(
                            "rounded-2xl border border-border bg-background/60 px-5 py-4 text-left font-medium transition-colors hover:border-primary/60 hover:bg-primary/5",
                            answers[current] === opt && "border-primary bg-primary/10",
                          )}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )
          )}
        </Panel>

        <Panel delay={0.1}>
          <h3 className="flex items-center gap-2 font-heading text-xl font-semibold"><Crown className="size-5 text-amber-500" /> Today&apos;s leaderboard</h3>
          {data.leaderboard.length ? (
            <ol className="mt-4 space-y-2">
              {data.leaderboard.map((r) => (
                <li key={r.userId} className="flex items-center gap-3 rounded-xl px-3 py-2 odd:bg-muted/50">
                  <span className={cn("w-6 text-center font-semibold tabular-nums", r.rank <= 3 && "text-amber-500")}>{r.rank}</span>
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="font-semibold tabular-nums">{r.score}/{r.total}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No scores yet today. Be the first!</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
