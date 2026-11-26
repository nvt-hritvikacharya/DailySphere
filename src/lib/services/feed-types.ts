import type { Article } from "../types";

export type FeedArticle = Article & { liked: boolean; bookmarked: boolean; likes: number };
