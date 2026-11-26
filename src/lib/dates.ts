export function safeTimeZone(tz?: string | null): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** YYYY-MM-DD for "today" in the given IANA time zone. Daily content is keyed by this. */
export function localDateKey(tz?: string | null, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
  return parts;
}

export function monthDay(dateKey: string) {
  const [, m, d] = dateKey.split("-").map(Number);
  return { month: m, day: d };
}

/** Deterministic integer from a string — used to pick daily items from curated lists. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dayOfYear(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
}
