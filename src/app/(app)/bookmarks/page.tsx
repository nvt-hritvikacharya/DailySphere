"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SectionHeader } from "@/components/daily/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type B = { id: string; type: string; refId: string; title: string; url: string | null; data: Record<string, string> | null; createdAt: string };

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "ARTICLE", label: "Articles" },
  { id: "FACT", label: "Facts" },
  { id: "TRIVIA", label: "Trivia" },
  { id: "WORD", label: "Words" },
  { id: "QUOTE", label: "Quotes" },
  { id: "HISTORY", label: "History" },
];

export default function BookmarksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("ALL");
  const { data, isLoading } = useQuery({ queryKey: ["bookmarks"], queryFn: () => api<{ bookmarks: B[] }>("/api/bookmarks") });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/bookmarks?id=${id}`, { method: "DELETE" }),
    onMutate: (id) => qc.setQueryData<{ bookmarks: B[] }>(["bookmarks"], (o) => (o ? { bookmarks: o.bookmarks.filter((b) => b.id !== id) } : o)),
    onSettled: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
  const items = (data?.bookmarks ?? []).filter((b) => filter === "ALL" || b.type === filter);

  return (
    <div>
      <SectionHeader title="Bookmarks" subtitle="Everything you've saved — stories, facts, words and more." />
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(f.id)}>
            {f.label}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-28 animate-pulse rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">Nothing saved here yet. Tap the bookmark icon on anything you want to keep.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {items.map((b) => (
              <motion.div key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass flex gap-4 rounded-2xl p-4">
                {b.data?.image && (
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                    <Image src={b.data.image} alt="" fill unoptimized sizes="80px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="rounded-full capitalize">{b.type.toLowerCase()}</Badge>
                    {b.data?.source && <span>{b.data.source}</span>}
                    <span>· saved {timeAgo(b.createdAt)}</span>
                  </div>
                  <p className={cn("mt-2 font-medium", b.type === "ARTICLE" || b.type === "WORD" ? "font-heading text-lg" : "text-sm")}>{b.title}</p>
                  {b.type === "WORD" && b.data?.meaning && <p className="mt-1 text-sm text-muted-foreground">{b.data.meaning}</p>}
                  {b.type === "QUOTE" && b.data?.author && <p className="mt-1 text-sm text-muted-foreground">— {b.data.author}</p>}
                  {b.type === "TRIVIA" && b.data?.answer && <p className="mt-1 text-sm text-muted-foreground">Answer: {b.data.answer}</p>}
                  <div className="mt-2 flex gap-1">
                    {b.url && (
                      <Button asChild variant="link" size="sm" className="h-auto px-0">
                        <a href={b.url} target="_blank" rel="noopener noreferrer">Open <ArrowUpRight /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="ml-auto h-auto text-muted-foreground" onClick={() => remove.mutate(b.id)}>
                      <Trash2 /> Remove
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
