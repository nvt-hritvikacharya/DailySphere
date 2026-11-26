import { FeedList } from "@/components/news/feed-list";

export const metadata = { title: "Trending" };

export default function TrendingPage() {
  return <FeedList type="trending" title="Trending now" subtitle="Today's top 20 stories, ranked by reader engagement and recency." ranked />;
}
