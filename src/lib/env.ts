const get = (k: string) => (process.env[k] ?? "").trim();

export const env = {
  adminEmails: get("ADMIN_EMAILS")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  cronSecret: get("CRON_SECRET"),
  supabaseUrl: get("SUPABASE_URL") || get("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: get("SUPABASE_ANON_KEY") || get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  gnewsKey: get("GNEWS_API_KEY"),
  newsApiKey: get("NEWSAPI_KEY"),
  openaiKey: get("OPENAI_API_KEY"),
  openaiModel: get("OPENAI_MODEL") || "gpt-4o-mini",
  wordnikKey: get("WORDNIK_API_KEY"),
  defaultLat: Number(get("DEFAULT_LAT") || 28.6139),
  defaultLon: Number(get("DEFAULT_LON") || 77.209),
  defaultCity: get("DEFAULT_CITY") || "New Delhi",
  useMocks: get("USE_MOCKS") === "true",
};

export const supabaseEnabled = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/** Set by Cursor's app hosting; viewers then arrive already signed in through the Cursor gate. */
export const cursorHosted = Boolean(get("CURSOR_APP_ID"));

export type AuthMode = "supabase" | "cursor" | "demo" | "disabled";

/**
 * Demo OTP (code 123456) proves nothing about the user, so it is only allowed in development
 * or when a self-hoster explicitly opts in with ALLOW_DEMO_LOGIN=true.
 */
export function authMode(): AuthMode {
  if (supabaseEnabled) return "supabase";
  if (cursorHosted) return "cursor";
  if (process.env.NODE_ENV !== "production" || get("ALLOW_DEMO_LOGIN") === "true") return "demo";
  return "disabled";
}
