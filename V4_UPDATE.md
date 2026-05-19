# Campus Event Map V4 Update

## Summary

V4 implements the full upgrade plan (items 1–19): smarter discovery, better maps, production-ready ingestion, calendar export, and test coverage.

## Highlights

### Discovery & AI
- Detail pages wire event context into the floating AI assistant via `ChatProvider`.
- Homepage AI retrieves semantically relevant events and includes them in responses.
- Chat API: Clerk-aware rate limiting (20 req/min) and semantic RAG context.
- **Smart search** toggle uses pgvector similarity instead of keyword `ilike`.
- **Recommended from your saves** on the Saved page (embedding centroid).

### Map & Location
- Map shows **all filtered events** (up to 500), not only the current list page.
- Marker clustering via `leaflet.markercluster`.
- Pan-to-marker when selecting from list or map.
- Mobile **tap to interact** overlay before enabling map gestures.
- **Near me** filter (1.5 km) using browser geolocation + Haversine distance.
- Expanded campus building lookup table (~50 aliases).
- `geocode_source` column: lookup / upstream / geocoder / fallback / none (virtual).
- Virtual/online events store `null` coordinates.

### Time & Filters
- **Happening now** filter and top-nav shortcut; LIVE events sorted first server-side.
- Debounced search (400ms) to reduce full page reloads.
- Unknown end times labeled on cards and detail pages.

### Saved & Calendar
- Export saved events as `.ics` (`/api/saved/export`).
- Google Calendar link on event detail pages.
- Saved page includes a map of bookmarked events.

### Data pipeline
- Single RSS fetch per ingest (no redundant downloads per “page”).
- Incremental embeddings via `embed_hash` (only re-embed when content changes).
- Nominatim rate-limited to ~1 req/sec during ingest.
- Auto-archive events ended 30+ days ago.
- Vercel Cron every 4 hours (`vercel.json`) + `revalidatePath` after ingest.

### Engineering
- Playwright smoke tests (`npm run test:e2e`).
- Updated `types/database.ts`, `supabase/schema.sql`, and README.

## Migration

Run new SQL in `supabase/schema.sql` on your Supabase project (adds `geocode_source`, `embed_hash`, ivfflat index).

Re-run ingestion after deploy:

```bash
curl -X POST https://YOUR_APP/api/cron/ingest -H "x-ingest-secret: YOUR_SECRET"
```
