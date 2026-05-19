import { Suspense } from "react";
import { ExploreShell } from "@/components/explore-shell";
import { EventFiltersSkeleton } from "@/components/event-filters-skeleton";
import { getCurrentUserId } from "@/lib/auth";
import { getEvents, getMapEvents, getSavedEventIds } from "@/lib/data";
import { hasSavedEventsConfig, hasSupabaseConfig } from "@/lib/env";
import { parseEventFilters } from "@/lib/parse-filters";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseEventFilters(params);

  const [{ events, page, total, pageSize }, mapEvents, userId] = await Promise.all([
    getEvents(filters),
    getMapEvents(filters),
    getCurrentUserId()
  ]);
  const savedIds = await getSavedEventIds(userId);
  const canSave = hasSavedEventsConfig();
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)] lg:items-end">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">What&apos;s happening on campus</h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Browse UChicago events by keyword, date, and category. Use smart search, near me, or happening now to discover faster.
          </p>
        </div>
        {!hasSupabaseConfig() ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars are missing. Configure them to enable data ingestion and persistence.
          </div>
        ) : null}
      </section>

      <Suspense fallback={<EventFiltersSkeleton />}>
        <ExploreShell
          events={events}
          mapEvents={mapEvents}
          savedEventIds={Array.from(savedIds)}
          canSave={canSave}
          filters={filters}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </Suspense>
    </main>
  );
}
