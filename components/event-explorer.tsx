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
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Sort events so happening now are at the top
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aStart = new Date(a.start_at).getTime();
      const aEnd = a.end_at ? new Date(a.end_at).getTime() : aStart + 3600000;
      const aLive = now >= aStart && now <= aEnd;

      const bStart = new Date(b.start_at).getTime();
      const bEnd = b.end_at ? new Date(b.end_at).getTime() : bStart + 3600000;
      const bLive = now >= bStart && now <= bEnd;

      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return 0;
    });
  }, [events, now]);

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(540px,1.45fr)_minmax(360px,0.85fr)]">
      <div className="order-2 space-y-4 xl:order-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Upcoming events</h2>
            <p className="text-sm text-slate-600">{total} matching events</p>
          </div>
        </div>

        {sortedEvents.length ? (
          sortedEvents.map((event) => {
            const startMs = new Date(event.start_at).getTime();
            const endMs = event.end_at ? new Date(event.end_at).getTime() : startMs + 3600000;
            const isHappeningNow = now >= startMs && now <= endMs;

            return (
              <div key={event.id} className="relative">
                {isHappeningNow && (
                  <div className="absolute -left-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                    </span>
                    LIVE
                  </div>
                )}
                <EventCard
                  event={event}
                  isSaved={savedIds.has(event.id)}
                  canSave={canSave}
                  selected={selectedEventId === event.id}
                  onSelect={() => setSelectedEventId(event.id)}
                />
              </div>
            );
          })
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
