# Campus Event Map V1 Summary

## Overview

Campus Event Map v1 is a working Next.js application that turns the University of Chicago public events feed into a searchable campus discovery tool. The app pulls event data from the UChicago Localist API, stores normalized records in Supabase, displays them in a filterable list and an interactive map, and allows signed-in users to save events they want to revisit.

This version delivers the full end-to-end core loop:

1. ingest public event data
2. normalize and geolocate it
3. store it in a database
4. render it in a student-friendly UI
5. support per-user saved events

## What V1 Implements

### 1. Event ingestion pipeline

- A protected ingestion endpoint exists at `app/api/cron/ingest/route.ts`.
- The endpoint fetches data from the UChicago Localist feed through `lib/localist.ts`.
- It accepts a page count parameter and imports multiple pages of upstream events in one run.
- Access is guarded by an `x-ingest-secret` header so the route can be called safely by a cron job or manual script.
- Normalized events are upserted into Supabase, so rerunning ingestion updates existing items instead of creating duplicates.

### 2. Event normalization and location resolution

- Raw Localist events are normalized into a stable internal schema in `lib/event-normalizer.ts`.
- Event records include title, slug, summary, description, categories, tags, source URL, event time, venue text, coordinates, and raw payload backup.
- The app resolves event coordinates with a layered fallback strategy in `lib/geocode.ts`:
  - first, match known campus buildings from a static lookup table
  - then, try OpenStreetMap Nominatim geocoding
  - finally, fall back to a campus center coordinate if the location is unclear
- This design handles messy real-world venue strings without breaking the map experience.

### 3. Supabase persistence layer

- The database schema is defined in `supabase/schema.sql`.
- `events` stores normalized campus event records.
- `saved_events` stores user-to-event bookmarks.
- Indexes are included for common queries such as start time, slug lookup, and category filtering.
- Row-level security is enabled.
- Public read access is allowed for event browsing.
- Saved event writes are constrained to service-role-backed server flows.

### 4. Explore page with filters and pagination

- The main page in `app/page.tsx` shows upcoming events in a card-based layout.
- Filters include:
  - keyword search
  - category
  - start date
  - end date
- Results are paginated and ordered by upcoming date.
- The page also shows setup warnings when required environment variables are missing, so the app degrades gracefully during development.

### 5. Interactive map view

- The app renders events on a Leaflet map through `components/event-map.tsx` and `components/event-map-client.tsx`.
- The map is paired with the list view so users can browse events both textually and spatially.
- This directly supports the main project goal: helping students discover what is happening near them on campus.

### 6. Event detail page

- Each event has its own route at `app/events/[slug]/page.tsx`.
- The detail page includes:
  - title
  - categories
  - formatted date and time
  - venue or location text
  - cleaned description
  - link back to the original source listing
- Users can also save or unsave the event from this page.

### 7. Authentication and saved events

- Clerk is integrated for authentication.
- Logged-in users can save and unsave events through `app/api/saved/route.ts`.
- Saved events are tied to the authenticated user ID and stored in Supabase.
- `app/saved/page.tsx` provides a dedicated saved-events page for a user's shortlist.
- If auth or database configuration is missing, the UI explains what is unavailable instead of crashing.

### 8. Reusable UI and application structure

- The app uses Next.js App Router with a clear separation between routes, UI components, and server-side data utilities.
- Reusable UI pieces include:
  - event cards
  - filter controls
  - empty states
  - top navigation
  - save button
- Tailwind CSS is used for styling and responsive layout.

## Technical Stack Used in V1

- Next.js App Router
- React 19
- Tailwind CSS
- Supabase
- Clerk
- Leaflet with OpenStreetMap tiles
- TypeScript

## Current Strengths of the V1

- End-to-end functionality is in place rather than mock-only UI.
- The data pipeline is designed to handle repeated imports safely through upserts.
- The map experience is grounded in actual event location resolution rather than placeholder coordinates.
- The app tolerates partial configuration, which makes development and demo setup less fragile.
- The structure is deployment-friendly for Vercel and future iteration.

## Known V1 Limitations

- Data quality still depends on the consistency of the upstream Localist feed.
- Geocoding is best-effort and may fall back to generic campus coordinates for ambiguous venues.
- Saved events require Clerk and Supabase service-role configuration to work fully.
- Ingestion currently runs through a protected endpoint and still needs production cron scheduling in deployment.

## Bottom Line

V1 is a functional prototype of the proposed product, not just a design mockup. It already supports real event ingestion, storage, browsing, filtering, mapping, event detail pages, and authenticated saved events. In practical terms, a user can open the app, browse upcoming UChicago events, see where they are on campus, and save the ones they care about.
