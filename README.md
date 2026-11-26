# DailySphere

A personalized daily news and knowledge platform. Users pick their interests, then get a briefing of AI-summarized headlines, weather, a word, a quote, a fact, ten "on this day" events and five trivia questions. All daily content rolls over at **12:00 AM in each user's own time zone**.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Prisma + PostgreSQL · Supabase Auth (email/phone OTP) · TanStack Query · Framer Motion · Docker

## Features

| Area | What it does |
| --- | --- |
| Auth | Email or phone OTP via Supabase. The app then issues a signed, httpOnly session that **expires after 1 hour of inactivity** (sliding window enforced in middleware). Without Supabase: on Cursor app hosting (private/team), viewers continue with their Cursor account; in development, demo mode with code `123456`. |
| Onboarding | Multi-select from 22 interests. The picks are stored on `Preference.interests`. |
| Home | Greeting, local date, weather (browser geolocation, then `DEFAULT_LAT/LON`), hero story plus grid, today's knowledge cards, trivia CTA |
| News cards | Headline, image, source, relative time, a 70–100 word summary, and **Read more** linking to the publisher (full articles are never reproduced). Each card has like, bookmark and share. |
| For You | Interests re-weighted by the user's reads and likes from the last 30 days. Articles already read are excluded. |
| Trending | Top 20 stories, ranked by in-app engagement (likes and reads over 48h) and recency |
| Discover / On This Day | Word of the day (with pronunciation and text-to-speech), quote, fact, and 10 Wikipedia "On this day" events |
| Trivia | 5 questions per local day, shared by every user so the leaderboard is fair. Answers stay on the server until you submit, each user gets one attempt per day, and there's a daily leaderboard. |
| Bookmarks | Articles, facts, trivia, words, quotes and history events, with type filters |
| Profile | Edit interests, view stats and reading history, toggle dark mode (persisted), and set notification preferences |
| Notifications | The hourly job creates a "briefing ready" notification for each user after their local midnight. A bell in the header shows them. |
| Admin (`ADMIN` role) | Totals, reads by category, most-read articles, trending topics, per-provider API health (success rate, fallback rate, latency), users, and app logs |

## Quick start (local)

```bash
cp .env.example .env            # set SESSION_SECRET (openssl rand -hex 32)
docker compose up -d db         # or use any Postgres and update DATABASE_URL
npm install
npx prisma migrate dev          # creates the schema
npm run db:seed                 # optional: admin + 5 demo readers + leaderboard
npm run dev                     # http://localhost:3000
```

To sign in, use any email or an international phone number (for example `+919876543210`). In demo mode the code is **`123456`**. Signing in as `admin@dailysphere.dev` (listed in `ADMIN_EMAILS`) unlocks `/admin`.

## Publishing on Cursor

`cursor-app.json` asks the platform for a Postgres database, which sets `DATABASE_URL`. `npm run build` runs `prisma migrate deploy` after `next build` when that variable is present. Publish as **private** or **team** so the Cursor gate signs viewers in. On a private app the first person to sign in becomes admin; on a team app, team admins are admins. `ADMIN_EMAILS` also applies.

## Docker (app + Postgres + hourly refresh job)

```bash
cp .env.example .env   # fill in secrets
docker compose up --build
```

The `app` container runs `prisma migrate deploy` on start. The `cron` service calls `POST /api/cron/refresh` every hour with `CRON_SECRET`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes (prod) | HMAC key for app session cookies |
| `ADMIN_EMAILS` | no | Comma-separated emails/phones granted `ADMIN` on sign-in |
| `CRON_SECRET` | yes for cron | Bearer token for `/api/cron/refresh` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | no | Turns on real email/SMS OTP (server-side only). |
| `ALLOW_DEMO_LOGIN` | no | `true` enables demo OTP (code `123456`) in production builds. **Never on a public deployment**: it accepts any email. Demo mode is always on in `npm run dev`. |
| `GNEWS_API_KEY` / `NEWSAPI_KEY` | no | Live headlines (GNews takes priority). Without them, curated mock headlines are used. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | no | AI summaries of 70–100 words. Without them, extractive summaries are built from the publisher snippet. |
| `WORDNIK_API_KEY` | no | Wordnik Word of the Day. Otherwise a curated word is used, enriched by the Free Dictionary API. |
| `DEFAULT_LAT`, `DEFAULT_LON`, `DEFAULT_CITY` | no | Weather location when geolocation is denied |
| `USE_MOCKS` | no | `true` skips every network provider (offline/CI) |

### Supabase setup
1. Create a project and copy the URL and anon key into `.env`.
2. **Auth → Providers → Email**: enable it, and change the magic-link template to include `{{ .Token }}` so users receive a 6-digit code.
3. **Auth → Providers → Phone**: enable it and configure an SMS provider (Twilio, MessageBird, Vonage, …).

Supabase verifies the OTP. DailySphere then links the Supabase user to its own `User` row (`supabaseId`) and manages the 1-hour idle session itself.

## Content providers and caching

Every provider lives in `src/lib/providers/*` and goes through `withProvider()`. That wrapper logs latency and success to `ApiLog` and returns a **mock fallback** on any failure or missing key, so the UI never breaks.

| Content | Live source | Key? | Fallback |
| --- | --- | --- | --- |
| News | GNews / NewsAPI | yes | Curated headlines for every interest |
| Summaries | OpenAI | yes | Extractive summary (70–100 words) |
| Weather | Open-Meteo | no | Static sample |
| On this day | Wikipedia (Wikimedia feed) | no | Curated events |
| Word | Wordnik → Free Dictionary | optional | Curated words |
| Quote | ZenQuotes | no | Curated quotes |
| Fact | uselessfacts.jsph.pl | no | Curated facts |
| Trivia | Open Trivia DB | no | Curated questions |

`cached()` (`src/lib/cache.ts`) is a two-level cache: process memory first, then the `CachedContent` table. Keys include the **user-local date** (for example `news:ai:2026-11-26`, `trivia:2026-11-26`), so a user's content changes exactly at their midnight. The browser sends its time zone in a `ds_tz` cookie, and the client also invalidates its queries at local midnight. `scripts/refresh.ts` (`npm run refresh`) and `/api/cron/refresh` pre-warm each active time zone, send notifications, and purge expired cache rows and logs older than 30 days.

## Scripts

`dev`, `build`, `start`, `lint`, `typecheck`, `db:migrate`, `db:deploy`, `db:seed`, `refresh`

## Project layout

```
prisma/              schema, migrations, seed
src/app/(app)/       authenticated pages (home, for-you, trending, discover, on-this-day, trivia, bookmarks, profile, admin)
src/app/api/         route handlers (auth, feed, daily, weather, trivia, bookmarks, likes, history, preferences, notifications, admin, cron, health)
src/components/      layout shell, news cards, daily widgets, shadcn/ui
src/lib/providers/   pluggable content providers and mock data
src/lib/services/    feed ranking, admin analytics, daily refresh job
src/lib/auth/        edge-safe session tokens and server session helpers
src/middleware.ts    route protection, 1h idle expiry, admin gate
```

## Production notes
- The rate limiter (`src/lib/rate-limit.ts`) keeps its counts in memory. Use Redis or Upstash when running more than one instance.
- Image URLs come from publishers and are rendered `unoptimized` because their hosts are arbitrary.
- `GET /api/health` checks the database and can be used as a container health check.
