"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { EventMap } from "@/components/event-map";
import type { EventFilters, EventRecord } from "@/types/event";

type Props = {
  events: EventRecord[];
  savedEventIds: string[];
  canSave: boolean;
  filters: EventFilters;
  total: number;
  page: number;
  totalPages: number;
};

export function EventExplorer({ events, savedEventIds, canSave, filters, total, page, totalPages }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const savedIds = useMemo(() => new Set(savedEventIds), [savedEventIds]);

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    document.getElementById(`event-card-${selectedEventId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, [selectedEventId]);

  function pageHref(nextPage: number) {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.category) next.set("category", filters.category);
    if (filters.dateFrom) next.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) next.set("dateTo", filters.dateTo);
    next.set("page", String(nextPage));
    return `/?${next.toString()}`;
  }

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(540px,1.45fr)_minmax(360px,0.85fr)]">
      <div className="order-2 space-y-4 xl:order-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Upcoming events</h2>
            <p className="text-sm text-slate-600">{total} matching events</p>
          </div>
        </div>

        {events.length ? (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSaved={savedIds.has(event.id)}
              canSave={canSave}
              selected={selectedEventId === event.id}
              onSelect={() => setSelectedEventId(event.id)}
            />
          ))
        ) : (
          <EmptyState
            title="No events match these filters"
            description="Adjust the date range or keyword filters, or run the ingestion endpoint after configuring Supabase."
          />
        )}

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Link
              href={page > 1 ? pageHref(page - 1) : "#"}
              aria-disabled={page <= 1}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
            <Link
              href={page < totalPages ? pageHref(page + 1) : "#"}
              aria-disabled={page >= totalPages}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="order-1 xl:sticky xl:top-6 xl:self-start">
        <EventMap events={events} selectedEventId={selectedEventId} onEventSelect={setSelectedEventId} />
      </div>
    </section>
  );
}
