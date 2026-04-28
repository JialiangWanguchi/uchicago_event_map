# Project Proposal: Campus Event Map

## One-Line Description
A web app that aggregates UChicago campus events into a searchable list and interactive map, helping students — especially newcomers — discover what's happening and where.

## The Problem
UChicago has a rich calendar of talks, workshops, performances, and student activities, but discovering them is frustrating. Event information lives on `events.uchicago.edu` in a long, text-heavy feed that is hard to browse and offers no spatial context. Students — especially new ones unfamiliar with campus geography — frequently miss events they would have attended simply because they didn't know about them or couldn't quickly tell where they were. There is no tool that answers the simple question: *"What's happening near me on campus this week?"*

Campus Event Map solves this by pulling events from UChicago's existing public feed and presenting them in two complementary views: a filterable list for quick scanning and an interactive map for spatial discovery. Students can save events they're interested in, building a personal schedule without switching between tabs or copying dates into a separate calendar.

## Target User
UChicago students, specifically:
- **New students** (first-years, transfer students, new graduate students) who don't yet know where buildings are and benefit from seeing events on a map.
- **Academically curious students** looking for talks, seminars, and workshops outside their department.
- **Socially active students** who want a single place to browse what's happening on campus this week and save the events they care about.

## Core Features (v1)
1. **Event ingestion** — Fetch events from the UChicago Localist JSON API (`events.uchicago.edu/api/2/events`) on a recurring schedule and store them in Supabase.
2. **List view with filters** — Browse events in a clean, card-based list. Filter by date range, category/tag, and keyword search.
3. **Interactive map view** — See event locations as markers on a Leaflet + OpenStreetMap map centered on the UChicago campus. Click a marker to see event details in a popup.
4. **Event detail page** — View full event information (title, description, time, location, link to original source) on a dedicated page.
5. **Save events** — Logged-in users can bookmark events to a personal "Saved" list for easy reference later.

## Tech Stack
- **Frontend:** Next.js (App Router) — server components for fast initial loads, client components for interactive map and filters.
- **Styling:** Tailwind CSS — rapid UI development, responsive by default, consistent design without custom CSS files.
- **Database:** Supabase (PostgreSQL) — stores ingested events and user-saved-event relationships. Supabase's row-level security simplifies per-user saved events. PostGIS extension is available if spatial queries are needed later.
- **Auth:** Clerk — fast to integrate, handles UChicago Google login (students use Google Workspace), avoids building auth from scratch.
- **Map:** Leaflet + react-leaflet with OpenStreetMap tiles — completely free, no API key required, good campus-level detail. Building coordinates stored in a static lookup table (~50 entries).
- **APIs:**
  - UChicago Localist API (`/api/2/events`) — public, no auth required, returns structured JSON with event title, description, dates, venue, and sometimes coordinates.
  - Nominatim (OpenStreetMap geocoder) — free fallback for any venue not in the static building table, rate-limited to 1 req/sec.
- **Deployment:** Vercel — zero-config Next.js hosting, automatic preview deploys per branch, generous free tier.
- **MCP Servers:**
  - Supabase MCP — manage database schema, run migrations, and query data directly from Claude Code during development.
  - Playwright MCP — end-to-end testing of map interactions, filter behavior, and save flows.

## Stretch Goals
- **"Happening Now" mode** — highlight events currently in progress with a pulsing marker on the map and a pinned section in the list view.
- **Category-based map clustering** — color-code markers by event type (academic, social, arts, athletics) and cluster nearby markers at low zoom levels.
- **Calendar export** — let users export saved events as an `.ics` file they can add to Google Calendar or Apple Calendar.
- **Weekly digest email** — opt-in email (via Supabase Edge Functions + Resend) summarizing upcoming saved events each Monday.
- **Mobile-optimized PWA** — add a service worker and manifest so students can "install" the app on their phone home screen for quick access.
- **Multi-source ingestion** — pull from additional feeds (department RSS feeds, student org calendars) to broaden coverage beyond the main Localist feed.
- **AI-powered event recommendations** — use embeddings (OpenAI or local) to suggest events similar to ones a user has saved, surfacing things they might not have found on their own.

## Biggest Risk
1. **Event data quality and location parsing.** The Localist API returns venue names as free-text strings (e.g., "Room 101, Cobb Hall" or "Quadrangle Club"). Mapping these strings to coordinates requires fuzzy matching against the static building table. Edge cases — virtual events, off-campus venues, vague locations like "Main Quad" — will need graceful fallbacks (e.g., show in list only, or place at a default campus-center pin). This is the single hardest integration problem in the project.
2. **Localist API reliability and completeness.** The API is public but undocumented for UChicago specifically. Fields like `geo` (coordinates) may or may not be populated. The first development task should be to fetch real data and audit what fields are actually available and how consistently they're filled.
3. **Map interaction on mobile.** Leaflet maps can conflict with touch scrolling on phones. Careful UX work (scroll-to-zoom disabled by default, a "tap to interact" overlay) will be needed to keep the mobile experience smooth.

## Week 5 Goal
By the end of Week 5, I will demo a live, deployed web app on Vercel that:
- Pulls real events from the UChicago Localist API into Supabase (via a scheduled fetch, even if manually triggered).
- Displays events in a paginated, filterable list view (filter by date and keyword at minimum).
- Shows event locations on an interactive Leaflet map with clickable markers and popups.
- Supports user login via Clerk and lets logged-in users save/un-save events.
- Has a "Saved Events" page showing the user's bookmarked events.

This is a fully functional v1 — a real user could open it, browse this week's events, see them on a map, and save the ones they want to attend.
