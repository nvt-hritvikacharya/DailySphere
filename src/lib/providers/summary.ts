import { env } from "../env";
import { fetchJson, withProvider } from "../logger";

const MIN_WORDS = 70;
const MAX_WORDS = 100;

const words = (s: string) => s.split(/\s+/).filter(Boolean);

function clampWords(text: string, max = MAX_WORDS) {
  const w = words(text);
  if (w.length <= max) return text.trim();
  const cut = w.slice(0, max).join(" ");
  const lastStop = cut.lastIndexOf(". ");
  return lastStop > cut.length * 0.6 ? cut.slice(0, lastStop + 1) : `${cut.replace(/[,;:]$/, "")}…`;
}

/**
 * Builds a 70–100 word summary without an LLM: uses the publisher's description/snippet and
 * pads with neutral context. Never reproduces full article content.
 */
export function extractiveSummary(input: { title: string; description?: string; category: string; source: string }) {
  const base = (input.description ?? "").replace(/\s*\[\+\d+ chars\]$/, "").trim();
  const sentences = [
    base || `${input.title}.`,
    `The report from ${input.source} adds to a fast-moving conversation in ${input.category}, where readers are watching how developments like this ripple outward.`,
    `Analysts and observers note that the details are still emerging, and further updates are likely as more information becomes available.`,
    `For the complete story, including quotes, data, and background, continue reading on the publisher's site.`,
  ];
  let out = "";
  for (const s of sentences) {
    out = out ? `${out} ${s}` : s;
    if (words(out).length >= MIN_WORDS) break;
  }
  return clampWords(out);
}

type OpenAIResponse = { choices: { message: { content: string } }[] };

export async function summarize(input: {
  title: string;
  description?: string;
  content?: string;
  category: string;
  source: string;
}): Promise<string> {
  const fallback = () => extractiveSummary(input);
  if (env.useMocks || !env.openaiKey) return fallback();
  return withProvider(
    "openai",
    async () => {
      const data = await fetchJson<OpenAIResponse>("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        timeoutMs: 15000,
        headers: { Authorization: `Bearer ${env.openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.openaiModel,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You write neutral news summaries of 70 to 100 words. Summarize only the provided snippet; do not invent facts or quote at length.",
            },
            {
              role: "user",
              content: `Headline: ${input.title}\nSource: ${input.source}\nSnippet: ${input.description ?? ""}\n${input.content ?? ""}`,
            },
          ],
        }),
      });
      const text = data.choices[0]?.message.content?.trim() ?? "";
      if (words(text).length < 40) throw new Error("summary too short");
      return clampWords(text);
    },
    fallback,
  );
}
