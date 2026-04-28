# Campus Event Map

Campus Event Map is a Next.js v1 implementation of the project described in `PROJECT_PROPOSAL.md`. It ingests public UChicago events, stores them in Supabase, renders a searchable list plus a Leaflet map, and lets signed-in users save events.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase
- Clerk
- Leaflet + OpenStreetMap

## What v1 includes

- Event ingestion endpoint for the UChicago Localist feed
- Filterable event list
- Interactive campus map
- Event detail page
- Saved events page
- Supabase schema for `events` and `saved_events`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `INGEST_SECRET`
   - `NOMINATIM_EMAIL` (recommended for fallback geocoding)

3. Run the SQL in [supabase/schema.sql](/E:/desktop/dbs/project/supabase/schema.sql:1).

4. Start the app:

   ```bash
   npm run dev
   ```

5. Trigger ingestion:

   ```bash
   curl -X POST http://localhost:3000/api/cron/ingest -H "x-ingest-secret: YOUR_SECRET"
   ```

## Notes

- The app tolerates missing Clerk or Supabase env vars and renders setup warnings instead of crashing.
- Location resolution uses a small campus building lookup first, then falls back to Nominatim, then campus center coordinates.
- Saved events are enforced server-side with Clerk user IDs and the Supabase service role key.
