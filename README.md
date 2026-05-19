# Campus Event Map

A Next.js app that aggregates UChicago campus events into a searchable list and interactive map. Students can filter by time and category, use semantic search and “near me,” save events, and export calendars.

## Stack

- Next.js 15 App Router
- Tailwind CSS
- Supabase (PostgreSQL + pgvector)
- Clerk
- Leaflet + OpenStreetMap + marker clustering
- OpenAI (embeddings + chat)

## Features (v4)

- LiveWhale RSS ingestion with incremental embeddings
- List + full-filter map with clustering and LIVE markers
- Smart search, happening now, near me
- AI assistant with event context on detail pages
- Saved events, `.ics` export, Google Calendar links
- Daily Vercel Cron ingestion (Hobby-compatible) + Playwright smoke tests

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and configure Supabase, Clerk, `INGEST_SECRET`, `NOMINATIM_EMAIL`, and `OPENAI_API_KEY`.

3. Apply [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Ingest events:

   ```bash
   curl -X POST http://localhost:3000/api/cron/ingest -H "x-ingest-secret: YOUR_SECRET"
   ```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check
- `npm run test:e2e` — Playwright tests (starts dev server automatically)

## Vercel deployment

- `vercel.json` runs ingest **once per day** at `0 6 * * *` (06:00 UTC), which satisfies the [Hobby cron limit](https://vercel.com/docs/cron-jobs/usage-and-pricing) (max one run per day).
- In the Vercel project, set `INGEST_SECRET` (for manual `curl`) and optionally `CRON_SECRET` (Vercel sends it as `Authorization: Bearer` on cron requests). You can use the **same value** for both.
- After the first deploy, trigger a manual ingest so data is available before the next scheduled run.

## Docs

- [PROJECT_PROPOSAL.md](PROJECT_PROPOSAL.md) — original product spec
- [V4_UPDATE.md](V4_UPDATE.md) — latest release notes
