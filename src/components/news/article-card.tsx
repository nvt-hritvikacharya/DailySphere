"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Bookmark, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useArticleActions } from "@/hooks/use-content";
import { timeAgo } from "@/lib/format";
import { interestById } from "@/lib/interests";
import type { FeedArticle } from "@/lib/services/feed-types";
import { cn } from "@/lib/utils";

type Variant = "hero" | "standard" | "compact";

export function ArticleCard({ article: a, variant = "standard", index = 0, rank }: { article: FeedArticle; variant?: Variant; index?: number; rank?: number }) {
  const { like, bookmark, recordRead, share } = useArticleActions();
  const interest = interestById(a.category);

  const actions = (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={() => like.mutate(a)} aria-pressed={a.liked} aria-label="Like">
        <Heart className={cn(a.liked && "fill-rose-500 text-rose-500")} />
        {a.likes > 0 && <span className="text-xs tabular-nums">{a.likes}</span>}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => bookmark.mutate(a)} aria-pressed={a.bookmarked} aria-label="Bookmark">
        <Bookmark className={cn(a.bookmarked && "fill-primary text-primary")} />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => share(a)} aria-label="Share">
        <Share2 />
      </Button>
      <Button asChild variant="link" size="sm" className="ml-auto px-0">
        <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={() => recordRead(a)}>
          Read more <ArrowUpRight />
        </a>
      </Button>
    </div>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {interest && <Badge variant="secondary" className="rounded-full">{interest.emoji} {interest.label}</Badge>}
      <span className="font-medium text-foreground/80">{a.source}</span>
      <span aria-hidden>·</span>
      <time dateTime={a.publishedAt}>{timeAgo(a.publishedAt)}</time>
    </div>
  );

  if (variant === "compact") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index, 10) * 0.04 }}
        className="group glass flex gap-4 rounded-2xl p-3"
      >
        {rank !== undefined && <span className="w-8 shrink-0 pt-1 text-center font-heading text-3xl font-semibold text-primary/70 tabular-nums">{rank}</span>}
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-28">
          <Image src={a.image} alt="" fill sizes="112px" unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {meta}
          <h3 className="line-clamp-2 font-heading text-lg leading-snug font-semibold">{a.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{a.summary}</p>
          {actions}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.05, duration: 0.4 }}
      className={cn("group glass flex flex-col overflow-hidden rounded-3xl", variant === "hero" && "lg:flex-row")}
    >
      <div className={cn("relative aspect-[16/10] overflow-hidden", variant === "hero" && "lg:aspect-auto lg:w-3/5")}>
        <Image
          src={a.image}
          alt=""
          fill
          unoptimized
          sizes={variant === "hero" ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority={variant === "hero"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className={cn("flex flex-1 flex-col gap-3 p-5", variant === "hero" && "lg:p-8")}>
        {meta}
        <h3 className={cn("font-heading leading-tight font-semibold text-balance", variant === "hero" ? "text-2xl sm:text-3xl" : "text-xl")}>{a.title}</h3>
        <p className={cn("text-sm leading-relaxed text-muted-foreground", variant !== "hero" && "line-clamp-4")}>{a.summary}</p>
        <div className="mt-auto pt-1">{actions}</div>
      </div>
    </motion.article>
  );
}

export function ArticleSkeleton({ variant = "standard" }: { variant?: Variant }) {
  return (
    <div className={cn("glass animate-pulse overflow-hidden rounded-3xl", variant === "compact" && "flex h-32 gap-4 rounded-2xl p-3")}>
      {variant === "compact" ? (
        <>
          <div className="size-24 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2 py-2"><div className="h-3 w-1/3 rounded bg-muted" /><div className="h-4 w-full rounded bg-muted" /><div className="h-4 w-2/3 rounded bg-muted" /></div>
        </>
      ) : (
        <>
          <div className="aspect-[16/10] bg-muted" />
          <div className="space-y-3 p-5"><div className="h-3 w-1/3 rounded bg-muted" /><div className="h-5 w-full rounded bg-muted" /><div className="h-4 w-5/6 rounded bg-muted" /></div>
        </>
      )}
    </div>
  );
}
