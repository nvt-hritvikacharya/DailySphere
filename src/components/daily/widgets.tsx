"use client";

import { motion } from "framer-motion";
import { Bookmark, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Lightbulb, MapPin, Moon, Quote as QuoteIcon, Sun, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleBookmark } from "@/hooks/use-content";
import type { Fact, HistoryEvent, Quote, Weather, WordOfDay } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Panel({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn("glass relative overflow-hidden rounded-3xl p-6", className)}
    >
      {children}
    </motion.section>
  );
}

function Eyebrow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
      <Icon className="size-3.5" /> {children}
    </p>
  );
}

function SaveButton(props: Parameters<ReturnType<typeof useToggleBookmark>["mutate"]>[0]) {
  const toggle = useToggleBookmark();
  return (
    <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" aria-label="Bookmark" onClick={() => toggle.mutate(props)}>
      <Bookmark />
    </Button>
  );
}

function weatherIcon(code: number, isDay: boolean) {
  if (code === 0 || code === 1) return isDay ? Sun : Moon;
  if (code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code < 50) return CloudFog;
  if (code < 70 || (code >= 80 && code < 90)) return CloudRain;
  if (code < 80) return CloudSnow;
  return CloudLightning;
}

export function WeatherWidget({
  weather,
  loading,
  located,
  denied,
  onLocate,
}: {
  weather?: Weather;
  loading?: boolean;
  located?: boolean;
  denied?: boolean;
  onLocate?: () => void;
}) {
  if (loading || !weather) return <div className="glass h-[104px] w-full animate-pulse rounded-3xl sm:w-72" />;
  const Icon = weatherIcon(weather.code, weather.isDay);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass flex w-full items-center gap-4 rounded-3xl p-5 sm:w-72">
      <Icon className="size-12 text-amber-500" strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="text-3xl font-semibold tabular-nums">{weather.temperature}°</p>
        <p className="truncate text-sm text-muted-foreground">
          {weather.description} · {weather.city}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          H {weather.high}° · L {weather.low}° · feels {weather.apparent}°
        </p>
        {onLocate && (!located || denied) && (
          <button
            type="button"
            onClick={onLocate}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <MapPin className="size-3" /> Use my location
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function FactCard({ fact, delay }: { fact: Fact; delay?: number }) {
  return (
    <Panel delay={delay} className="bg-gradient-to-br from-amber-200/40 to-transparent dark:from-amber-500/10">
      <Eyebrow icon={Lightbulb}>Fact of the day</Eyebrow>
      <SaveButton type="FACT" refId={fact.id} title={fact.text} data={{ text: fact.text }} />
      <p className="mt-4 font-heading text-xl leading-snug font-medium text-balance">{fact.text}</p>
    </Panel>
  );
}

export function WordCard({ word, delay }: { word: WordOfDay; delay?: number }) {
  const speak = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(word.word));
  };
  return (
    <Panel delay={delay} className="bg-gradient-to-br from-indigo-200/50 to-transparent dark:from-indigo-500/10">
      <Eyebrow icon={Volume2}>Word of the day</Eyebrow>
      <SaveButton type="WORD" refId={word.word.toLowerCase()} title={word.word} data={word} />
      <div className="mt-4 flex items-baseline gap-3">
        <h3 className="font-heading text-4xl font-semibold tracking-tight">{word.word}</h3>
        <button onClick={speak} className="text-muted-foreground hover:text-primary" aria-label="Pronounce">
          <Volume2 className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {word.pronunciation && <span className="font-mono">{word.pronunciation}</span>} {word.partOfSpeech && <em>· {word.partOfSpeech}</em>}
      </p>
      <p className="mt-3 leading-relaxed">{word.meaning}</p>
      {word.example && <p className="mt-3 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground italic">“{word.example}”</p>}
    </Panel>
  );
}

export function QuoteCard({ quote, delay }: { quote: Quote; delay?: number }) {
  return (
    <Panel delay={delay} className="bg-gradient-to-br from-rose-200/40 to-transparent dark:from-rose-500/10">
      <Eyebrow icon={QuoteIcon}>Quote of the day</Eyebrow>
      <SaveButton type="QUOTE" refId={`${quote.author}:${quote.text.slice(0, 40)}`} title={quote.text} data={quote} />
      <blockquote className="mt-4 font-heading text-2xl leading-snug font-medium text-balance">“{quote.text}”</blockquote>
      <p className="mt-3 text-sm text-muted-foreground">— {quote.author}</p>
    </Panel>
  );
}

export function HistoryTimeline({ events, limit }: { events: HistoryEvent[]; limit?: number }) {
  const toggle = useToggleBookmark();
  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {events.slice(0, limit).map((e, i) => (
        <motion.li key={`${e.year}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="group relative">
          <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-primary ring-4 ring-background" />
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-heading text-2xl font-semibold text-primary tabular-nums">{e.year}</p>
              <p className="mt-1 leading-relaxed">{e.text}</p>
              <div className="mt-1 flex gap-1">
                {e.url && (
                  <Button asChild variant="link" size="sm" className="h-auto px-0">
                    <a href={e.url} target="_blank" rel="noopener noreferrer">Read on Wikipedia</a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 opacity-60 group-hover:opacity-100"
                  onClick={() => toggle.mutate({ type: "HISTORY", refId: `${e.year}:${e.text.slice(0, 60)}`, title: `${e.year}: ${e.text}`, url: e.url, data: { ...e } })}
                >
                  <Bookmark className="size-3.5" /> Save
                </Button>
              </div>
            </div>
            {e.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.image} alt="" className="hidden size-20 shrink-0 rounded-xl object-cover sm:block" loading="lazy" />
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
