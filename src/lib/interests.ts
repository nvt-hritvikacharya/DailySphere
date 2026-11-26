export const INTERESTS = [
  { id: "technology", label: "Technology", emoji: "💻", query: "technology" },
  { id: "science", label: "Science", emoji: "🔬", query: "science" },
  { id: "ai", label: "AI", emoji: "🤖", query: "artificial intelligence" },
  { id: "finance", label: "Finance", emoji: "💰", query: "finance" },
  { id: "business", label: "Business", emoji: "📈", query: "business" },
  { id: "sports", label: "Sports", emoji: "🏅", query: "sports" },
  { id: "movies", label: "Movies", emoji: "🎬", query: "movies" },
  { id: "gaming", label: "Gaming", emoji: "🎮", query: "video games" },
  { id: "politics", label: "Politics", emoji: "🏛️", query: "politics" },
  { id: "health", label: "Health", emoji: "🩺", query: "health" },
  { id: "travel", label: "Travel", emoji: "✈️", query: "travel" },
  { id: "food", label: "Food", emoji: "🍜", query: "food" },
  { id: "space", label: "Space", emoji: "🚀", query: "space exploration" },
  { id: "history", label: "History", emoji: "📜", query: "history archaeology" },
  { id: "books", label: "Books", emoji: "📚", query: "books" },
  { id: "photography", label: "Photography", emoji: "📷", query: "photography" },
  { id: "cars", label: "Cars", emoji: "🚗", query: "cars automotive" },
  { id: "cricket", label: "Cricket", emoji: "🏏", query: "cricket" },
  { id: "football", label: "Football", emoji: "⚽", query: "football soccer" },
  { id: "formula1", label: "Formula 1", emoji: "🏎️", query: "formula 1" },
  { id: "stocks", label: "Stock Market", emoji: "📊", query: "stock market" },
  { id: "crypto", label: "Cryptocurrency", emoji: "🪙", query: "cryptocurrency" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export const INTEREST_IDS = INTERESTS.map((i) => i.id) as InterestId[];

export function interestById(id: string) {
  return INTERESTS.find((i) => i.id === id);
}
