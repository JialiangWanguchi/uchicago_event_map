import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Download } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { EventMap } from "@/components/event-map";
import { getCurrentUserId } from "@/lib/auth";
import { getRecommendedForUser, getSavedEvents } from "@/lib/data";
import { hasSavedEventsConfig } from "@/lib/env";
import { getEventTimeStatus, sortEventsForDisplay } from "@/lib/event-status";
import { formatEventDate } from "@/lib/utils";
import type { EventRecord, MapEventRecord } from "@/types/event";

// Force dynamic rendering so saved-event ordering is computed per request and
// never served from a stale build cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SavedPage() {
  const userId = await getCurrentUserId();

  if (!hasSavedEventsConfig()) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState title="Saved events are disabled" description="Configure Clerk and the Supabase service role key to enable bookmarks." />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-panel">
          <h1 className="text-2xl font-semibold text-slate-950">Sign in to see saved events</h1>
          <p className="mt-2 text-sm text-slate-600">Bookmarks are tied to your account.</p>
          <div className="mt-6">
            <SignInButton mode="modal">
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white">Sign in</button>
            </SignInButton>
          </div>
        </div>
      </main>
    );
  }

  const [rawSaved, recommended] = await Promise.all([getSavedEvents(userId), getRecommendedForUser(userId)]);
  // Mirror the explore page ordering: live (latest start first) → upcoming (soonest first) → ended (earliest end first).
  const events = sortEventsForDisplay(rawSaved);
  const now = Date.now();
  const live: EventRecord[] = [];
  const upcoming: EventRecord[] = [];
  const ended: EventRecord[] = [];
  for (const event of events) {
    const status = getEventTimeStatus(event, now);
    if (status === "live") live.push(event);
    else if (status === "upcoming") upcoming.push(event);
    else ended.push(event);
  }
  const mapEvents: MapEventRecord[] = events
    .filter((event) => event.latitude != null && event.longitude != null)
    .map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      start_at: event.start_at,
      end_at: event.end_at,
      latitude: event.latitude,
      longitude: event.longitude,
      categories: event.categories,
      location_text: event.location_text,
      venue_name: event.venue_name,
      geocode_source: event.geocode_source
    }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Saved events</h1>
          <p className="mt-2 text-sm text-slate-600">Your personal shortlist and calendar export.</p>
        </div>
        {events.length > 0 ? (
          <a
            href="/api/saved/export"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export .ics
          </a>
        ) : null}
      </div>

      {mapEvents.length > 0 ? (
        <div className="mb-8">
          <EventMap events={mapEvents} />
        </div>
      ) : null}

      <div className="space-y-6">
        {events.length ? (
          <>
            {live.length > 0 ? (
              <section className="space-y-3">
                <h2 className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                  Happening now ({live.length})
                </h2>
                {live.map((event) => (
                  <EventCard key={event.id} event={event} isSaved canSave />
                ))}
              </section>
            ) : null}
            {upcoming.length > 0 ? (
              <section className="space-y-3">
                <h2 className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Upcoming ({upcoming.length})
                </h2>
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} isSaved canSave />
                ))}
              </section>
            ) : null}
            {ended.length > 0 ? (
              <section className="space-y-3">
                <h2 className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ended ({ended.length})
                </h2>
                {ended.map((event) => (
                  <EventCard key={event.id} event={event} isSaved canSave />
                ))}
              </section>
            ) : null}
          </>
        ) : (
          <EmptyState title="No saved events yet" description="Browse events and bookmark the ones you want to keep." />
        )}
      </div>

      {recommended.length > 0 ? (
        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold text-slate-950">Recommended from your saves</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recommended.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel hover:border-brand-400"
              >
                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                <p className="mt-1 text-xs text-slate-600">{formatEventDate(event.start_at, event.end_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to explore
        </Link>
      </div>
    </main>
  );
}
