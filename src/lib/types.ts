export type Article = {
  id: string;
  title: string;
  image: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  summary: string;
};

export type Weather = {
  city: string;
  temperature: number;
  apparent: number;
  code: number;
  description: string;
  high: number;
  low: number;
  isDay: boolean;
  mock?: boolean;
};

export type HistoryEvent = { year: number; text: string; url?: string; image?: string };

export type WordOfDay = {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
};

export type Quote = { text: string; author: string };

export type Fact = { id: string; text: string; source?: string };

export type TriviaQuestion = {
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty: string;
};

/** Server-only shape; answers are never sent to the client before submission. */
export type TriviaQuestionWithAnswer = TriviaQuestion & { answer: string };

export type DailyBundle = {
  date: string;
  fact: Fact;
  word: WordOfDay;
  quote: Quote;
  history: HistoryEvent[];
};
