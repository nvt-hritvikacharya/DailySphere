const get = (k: string) => (process.env[k] ?? "").trim();

export const env = {
  sessionSecret: get("SESSION_SECRET") || "dev-insecure-secret",
  adminEmails: get("ADMIN_EMAILS")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  cronSecret: get("CRON_SECRET"),
  supabaseUrl: get("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
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
