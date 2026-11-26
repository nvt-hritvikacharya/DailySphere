import { cached } from "../cache";
import { dayOfYear, hashString, monthDay } from "../dates";
import { env } from "../env";
import { fetchJson, withProvider } from "../logger";
import type { DailyBundle, Fact, HistoryEvent, Quote, TriviaQuestionWithAnswer, WordOfDay } from "../types";
import { MOCK_FACTS, MOCK_HISTORY, MOCK_QUOTES, MOCK_TRIVIA, MOCK_WORDS } from "./mock-data";

const DAY = 26 * 3600; // a little over a day; keys are date-scoped anyway

const pick = <T,>(list: T[], dateKey: string, salt = "") => list[hashString(dateKey + salt) % list.length];

export function getHistory(dateKey: string): Promise<HistoryEvent[]> {
  const { month, day } = monthDay(dateKey);
  return cached(`history:${month}-${day}`, { kind: "history", date: dateKey, ttlSeconds: DAY }, () =>
    withProvider(
      "wikipedia-onthisday",
      env.useMocks
        ? null
        : async () => {
            type R = { events: { year: number; text: string; pages?: { content_urls?: { desktop?: { page?: string } }; thumbnail?: { source: string } }[] }[] };
            const mm = String(month).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            const d = await fetchJson<R>(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${mm}/${dd}`, {
              headers: { "User-Agent": "DailySphere/1.0 (https://github.com/dailysphere)" },
            });
            if (!d.events?.length) throw new Error("no events");
            // Spread across eras instead of only the most recent events.
            const sorted = [...d.events].sort((a, b) => b.year - a.year);
            const step = Math.max(1, Math.floor(sorted.length / 10));
            return sorted
              .filter((_, i) => i % step === 0)
              .slice(0, 10)
              .map((e) => ({
                year: e.year,
                text: e.text,
                url: e.pages?.[0]?.content_urls?.desktop?.page,
                image: e.pages?.find((p) => p.thumbnail)?.thumbnail?.source,
              }));
          },
      () => MOCK_HISTORY,
    ),
  );
}

export function getFact(dateKey: string): Promise<Fact> {
  return cached(`fact:${dateKey}`, { kind: "fact", date: dateKey, ttlSeconds: DAY }, () =>
    withProvider(
      "uselessfacts",
      env.useMocks
        ? null
        : async () => {
            // The "today" endpoint is UTC-based; "random" + date-keyed cache gives one fact per local day.
            const d = await fetchJson<{ id: string; text: string; source_url?: string }>(
              "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
            );
            return { id: d.id, text: d.text, source: d.source_url };
          },
      () => pick(MOCK_FACTS, dateKey),
    ),
  );
}

export function getQuote(dateKey: string): Promise<Quote> {
  return cached(`quote:${dateKey}`, { kind: "quote", date: dateKey, ttlSeconds: DAY }, () =>
    withProvider(
      "zenquotes",
      env.useMocks
        ? null
        : async () => {
            const d = await fetchJson<{ q: string; a: string }[]>("https://zenquotes.io/api/random");
            if (!d[0]?.q || d[0].q.includes("Too many requests")) throw new Error("rate limited");
            return { text: d[0].q, author: d[0].a };
          },
      () => pick(MOCK_QUOTES, dateKey),
    ),
  );
}

export function getWord(dateKey: string): Promise<WordOfDay> {
  const curated = MOCK_WORDS[dayOfYear(dateKey) % MOCK_WORDS.length];
  return cached(`word:${dateKey}`, { kind: "word", date: dateKey, ttlSeconds: DAY }, async () => {
    if (env.wordnikKey && !env.useMocks) {
      return withProvider(
        "wordnik",
        async () => {
          type R = { word: string; definitions: { text: string; partOfSpeech: string }[]; examples: { text: string }[] };
          const d = await fetchJson<R>(`https://api.wordnik.com/v4/words.json/wordOfTheDay?date=${dateKey}&api_key=${env.wordnikKey}`);
          return {
            word: d.word.charAt(0).toUpperCase() + d.word.slice(1),
            pronunciation: "",
            partOfSpeech: d.definitions[0]?.partOfSpeech ?? "",
            meaning: d.definitions[0]?.text ?? "",
            example: d.examples[0]?.text ?? "",
          };
        },
        () => curated,
      );
    }
    // Free Dictionary enriches the curated word with phonetics; the curated entry is the fallback.
    return withProvider(
      "free-dictionary",
      env.useMocks
        ? null
        : async () => {
            type R = { phonetic?: string; meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[] }[];
            const d = await fetchJson<R>(`https://api.dictionaryapi.dev/api/v2/entries/en/${curated.word.toLowerCase()}`);
            const m = d[0]?.meanings[0];
            return {
              ...curated,
              pronunciation: d[0]?.phonetic || curated.pronunciation,
              partOfSpeech: m?.partOfSpeech || curated.partOfSpeech,
              meaning: m?.definitions[0]?.definition || curated.meaning,
            };
          },
      () => curated,
    );
  });
}

function decodeHtml(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&eacute;/g, "é")
    .replace(/&[a-z]+;/g, "");
}

function shuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  let h = hashString(seed);
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 5 questions shared by everyone on the same local date, so the leaderboard is fair. */
export function getTriviaWithAnswers(dateKey: string): Promise<TriviaQuestionWithAnswer[]> {
  return cached(`trivia:${dateKey}`, { kind: "trivia", date: dateKey, ttlSeconds: DAY }, () =>
    withProvider(
      "opentdb",
      env.useMocks
        ? null
        : async () => {
            type R = { response_code: number; results: { question: string; correct_answer: string; incorrect_answers: string[]; category: string; difficulty: string }[] };
            const d = await fetchJson<R>("https://opentdb.com/api.php?amount=5&type=multiple");
            if (d.response_code !== 0 || d.results.length < 5) throw new Error(`opentdb code ${d.response_code}`);
            return d.results.map((r, i) => {
              const answer = decodeHtml(r.correct_answer);
              return {
                id: `${dateKey}-${i}`,
                question: decodeHtml(r.question),
                options: shuffle([answer, ...r.incorrect_answers.map(decodeHtml)], `${dateKey}${i}`),
                answer,
                category: decodeHtml(r.category),
                difficulty: r.difficulty,
              };
            });
          },
      () => shuffle(MOCK_TRIVIA, dateKey).slice(0, 5).map((q, i) => ({ ...q, id: `${dateKey}-${i}` })),
    ),
  );
}

export async function getDailyBundle(dateKey: string): Promise<DailyBundle> {
  const [fact, word, quote, history] = await Promise.all([
    getFact(dateKey),
    getWord(dateKey),
    getQuote(dateKey),
    getHistory(dateKey),
  ]);
  return { date: dateKey, fact, word, quote, history };
}
