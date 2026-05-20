# Campus Event Map V4 Update

## What I Built This Week

This week was the stabilization sprint that took Campus Event Map from "feature complete" to actually pleasant to use. V3 had introduced the AI assistant, semantic search, near-me, and clustering, but using the page surfaced a long tail of friction: redundant buttons, an event list that fought the user, a map that lied about how many events it had, and a daily ingest job that was silently failing in production. I spent the week burning down that list.

### 1. I simplified the filter bar

The discovery surface had three buttons (`Happening now`, `Smart search`, `Live now` in the nav) that did not earn their space. I removed all three. Live state is already obvious from the dedicated "Happening now" section in the list and from the pulsing red marker on the map, so a separate toggle was double-conveying the same idea. Smart search was hidden behind a toggle that most users never tried, while keyword search via `ilike` already covers the home page; the embedding pipeline is still live under `/api/search` and the chat assistant's RAG context, just no longer surfaced as UI.

In their place I added two things that actually answer real questions:

- An **Ended on map** toggle, off by default. With it off, the map only shows live and upcoming events, so the campus does not look haunted by yesterday's lectures. The right list still has its own *Ended* section, so finished events are never lost — they just stop polluting the map.
- A **Within** distance picker (500 m / 1 km / 1.5 km / 2 km / 3 km) that appears next to *Near me* when it is on. The selected radius writes to `maxDistanceKm` in the URL and is drawn as the circle around the user's location.

### 2. I replaced pagination with a single scrollable list

The old explore page paginated 12 events at a time. People kept missing events because they did not realize pagination existed, and clicking *Next* meant the map re-rendered and the user lost their place. I rewrote the right pane as one fixed-height scroll container with three sticky section headers:

- **Happening now** — sorted by `start_at` descending so the most recently started event is on top.
- **Upcoming** — sorted by `start_at` ascending, soonest first.
- **Ended** — sorted by `end_at` ascending so the earliest-ended is at the top of the section and newly-ended events drop to the bottom.

The map panel is also fixed height. The page no longer grows or shrinks with the number of events, which means the layout is predictable regardless of feed size.

### 3. I made the map and the list actually talk to each other

In V3, clicking a map marker would change the URL or pin a copy of the event to the top of the list, which felt magical the first time and confusing every time after. Clicking a list card did nothing to the map. I redid both directions:

- **Click a marker → the list scrolls** that event's card to the top of its scroll container, smoothly. The card is highlighted with a golden ring. No teleporting, no duplicate cards.
- **Click a card → the map flies** to that event's coordinate, opens its popup, and the marker gets the same golden ring (live markers also scale up slightly). Other clicks inside the card (links, save button, "Original listing") use `stopPropagation` so they do not also trigger the map flight.

The two flows share a single `selectedEventId` state but use a small `scrollListOnSelectRef` flag to track which side initiated the change, so they never cause feedback loops where the map jumps and the list scrolls and the map jumps again.

### 4. I fixed the cluster math

The most visible bug was that the marker cluster would say "26" but zooming in revealed only two pins. The reason was that many UChicago events share the exact same `(lat, lng)` — every event in Mansueto, for instance, has identical coordinates. The cluster was correctly counting markers, but the markers were stacking on top of each other so the user could only see one of them.

I changed the cluster to group events by `lat/lng` rounded to 5 decimals (~1.1 m). Each unique coordinate now gets exactly one marker. Clicking that marker opens a popup with a **paginator** in its header when the spot has more than one event:

```
[ ← ]   3 / 26 at this spot   [ → ]
```

Pressing the arrows cycles through events at that location *and* fires the same `onEventSelect` callback the right-side list listens to, so the highlighted card in the list tracks the popup. From the user's perspective: the cluster count now matches what they see when they zoom in, and they can browse all events at a busy spot without leaving the map.

### 5. I stopped piling unmatched events on Main Quad

I noticed a single marker on Main Quad with 26 events. None of them were actually held there — they were the events whose venue strings did not match the in-app `BUILDING_COORDINATES` table, and the geocoder was silently falling back to the campus center. So Main Quad was acting as a sink for "we don't know where this is."

Now only two geocode sources produce a map pin:

- `upstream` — coordinates included in the LiveWhale RSS (`<georss:point>`).
- `lookup` — venue text matched against the local building dictionary.

`fallback` (no match) and `none` (virtual) write `null` for both lat and lng, so those events do not appear on the map. They still appear in the right-side list if they have a venue or address string, just without a pin. The remote Nominatim geocoder is now opt-in only, because it enforces 1 request per second and was blowing past the Vercel function timeout.

### 6. I deleted "Location TBD" events from the UI entirely

LiveWhale emits a lot of items with neither `venue_name` nor `location_text`. Those used to show up in the right-side list as "Location TBD" and count toward the total. They were impossible to act on, so I filter them out at the data layer. They do not appear in the list, in the total count, or on the map.

### 7. I fixed the calendar overlap and other stacking bugs

When users opened the *Start date* picker, the calendar disappeared behind the map. The cause was that Leaflet sets internal panes at z-index 200–700, but its container's own z-index is `auto`, so those internal layers leaked into the parent stacking context and outranked the calendar's `z-20`.

Fix: I wrapped the map in `isolation: isolate`, which creates a private stacking context that contains Leaflet's z-indices entirely inside the map. The filter section now sits at `z-[1000]` above it, and the calendar pops above the map cleanly.

I also re-themed the `Other` map category from gray to indigo so that gray is reserved exclusively for ended events, and updated the legend.

### 8. I fixed the ingest job (the one that was secretly broken)

When users complained that the list "only shows Ended events," it turned out the daily Vercel cron had not been writing anything to Supabase. Two compounding causes:

- **OpenAI for every event.** The ingest was generating embeddings inline for every event whose content hash changed. At ~500 ms per OpenAI roundtrip and 700+ events, the function blew past Vercel's 60 s timeout.
- **Nominatim for every venue without a lookup match.** Nominatim's usage policy enforces ≥1 second between requests. Combined with the OpenAI calls, the job became unfinishable.

Both are now opt-in:

- Embeddings only run on `POST /api/cron/ingest?embeddings=1`. Daily cron skips them.
- Nominatim is gated behind a function-level flag and is off in the cron path.

I also added:

- `export const maxDuration = 60;` and `dynamic = "force-dynamic"` on the cron route.
- A retry path that strips the V3-era columns (`geocode_source`, `embedding`, `embed_hash`) and re-upserts when Supabase returns `PGRST204: Could not find the 'geocode_source' column`, so the ingest still succeeds on databases that have not been migrated.
- Real error surfaces in the API response — the old code returned `"Unknown ingestion error"` for everything, which was the actual reason I could not debug this from the outside.

After all of that, the manual trigger now returns:

```
{ "imported": 757, "archived": 0, "embedded": 0 }
```

…in about 8 seconds, well under the 60 s limit.

### 9. I fixed the "only Ended events" data-layer bug

Even with ingestion working, the server-side query for the home page was `start_at >= today`, which has two failure modes:

1. A multi-day or all-day event that started yesterday and is still running was excluded because its `start_at` was in the past.
2. By mid-afternoon, every event left in the window had already ended that morning, so the page literally looked like "Ended" was the only section that existed.

I changed the default filter to be expressed on `end_at`:

```
end_at >= now                                  -- still live or in the future
OR end_at >= now - 3d                          -- recently ended (for the Ended section)
OR (end_at IS NULL AND start_at >= now - 3d)   -- missing end_at fallback
```

Explicit user-supplied `dateFrom` / `dateTo` are still honored exactly as before. The result: live events never get dropped from the page, regardless of when they started.

## What the page looks like now

- Top: search box, two calendar pickers (start and end), category dropdown.
- Below the inputs: chip-style toggles for *Ended on map* and *Near me* (+ distance picker when active).
- Below that: a left map and a right scrollable list of events, both fixed height.
- The map shows clustered markers, color-coded by category; live events pulse; the selected event has a gold ring.
- The list groups events into *Happening now*, *Upcoming*, *Ended*, sorted as described above.
- Clicking either side highlights both.

## How to refresh data after deploy

The daily Vercel cron at `06:00 UTC` runs automatically. To trigger an immediate refresh:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://YOUR_APP.vercel.app/api/cron/ingest" `
  -Headers @{ "x-ingest-secret" = "$env:INGEST_SECRET" }
```

Expected response: `{ "imported": <N>, "archived": <N>, "embedded": 0 }`. Add `?embeddings=1` to the URL if `OPENAI_API_KEY` is configured and you want semantic features rebuilt — that path is slower and may exceed 60 s on a cold database.

## Files I touched this week

```
app/page.tsx
app/api/cron/ingest/route.ts
components/event-card.tsx
components/event-explorer.tsx
components/event-filters.tsx
components/event-map.tsx
components/event-map-client.tsx
components/event-map-cluster.tsx
components/explore-shell.tsx
components/map-location-context.tsx
components/top-nav.tsx
lib/constants.ts
lib/data.ts
lib/event-normalizer.ts
lib/event-status.ts
lib/geocode.ts
lib/map-categories.ts
lib/parse-filters.ts
tests/e2e/smoke.spec.ts
types/event.ts
```

## Net result

The app went from "demo that mostly works if you squint" to something I would actually hand to a student on campus. The list and map agree about what events exist, the map agrees with itself about how many markers are where, the daily cron actually writes data, and the UI does not have buttons that secretly do nothing. The remaining work — wider geocoding coverage, better venue normalization, an admin "refresh data" button — is now incremental rather than blocking.
