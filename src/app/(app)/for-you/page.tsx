import { FeedList } from "@/components/news/feed-list";

export const metadata = { title: "For You" };

export default function ForYouPage() {
  return <FeedList type="foryou" title="For You" subtitle="Recommendations that learn from what you read and like." />;
}
