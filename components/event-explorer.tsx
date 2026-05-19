"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { EventMap } from "@/components/event-map";
import { getEventTimeStatus } from "@/lib/event-status";
import { formatDistanceKm } from "@/lib/geo-utils";
import { useMapLocation } from "@/components/map-location-context";
import type { EventFilters, EventRecord, MapEventRecord } from "@/types/event";

const PANEL_HEIGHT = "h-[680px] xl:h-[760px]";

type Props = {
  events: EventRecord[];
  mapEvents: MapEventRecord[];
  savedEventIds: string[];
  canSave: boolean;
  filters: EventFilters;
  total: number;
};

function ListSectionHeader({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-1 py-2 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

export function EventExplorer({ events, mapEvents, savedEventIds, canSave, filters, total }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const savedIds = useMemo(() => new Set(savedEventIds), [savedEventIds]);
  const [now, setNow] = useState(Date.now());
  const { userLocation, nearMeActive, nearMeRadiusKm, locationLoading, locationError } = useMapLocation();

  const listSections = useMemo(() => {
    const live: EventRecord[] = [];
    const upcoming: EventRecord[] = [];
    const ended: EventRecord[] = [];

    for (const event of events) {
      const status = getEventTimeStatus(event, now);
      if (status === "live") live.push(event);
      else if (status === "upcoming") upcoming.push(event);
      else ended.push(event);
    }

    return { live, upcoming, ended };
  }, [events, now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    const timer = window.setTimeout(() => {
      const container = listScrollRef.current;
      const card = document.getElementById(`event-card-${selectedEventId}`);
      if (!container || !card) return;

      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const nextTop = container.scrollTop + (cardRect.top - containerRect.top);

      container.scrollTo({ top: nextTop, behavior: "smooth" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [selectedEventId, events]);

  useEffect(() => {
    if (nearMeActive && userLocation) {
      setCenterOnUser(true);
      const timer = window.setTimeout(() => setCenterOnUser(false), 800);
      return () => window.clearTimeout(timer);
    }
  }, [nearMeActive, userLocation]);

  function renderEvent(event: EventRecord) {
    return (
      <EventCard
        key={event.id}
        event={event}
        isSaved={savedIds.has(event.id)}
        canSave={canSave}
        selected={selectedEventId === event.id}
        onSelect={() => setSelectedEventId(event.id)}
        distanceLabel={event.distance_km != null ? formatDistanceKm(event.distance_km) : undefined}
        endTimeUnknown={!event.end_at}
        now={now}
      />
    );
  }

  return (
    <section className={`mt-6 grid gap-6 xl:grid-cols-[minmax(540px,1.45fr)_minmax(360px,0.85fr)] xl:items-start`}>
      <div className={`order-1 ${PANEL_HEIGHT} overflow-hidden`}>
        <EventMap
          events={mapEvents}
          selectedEventId={selectedEventId}
          onEventSelect={setSelectedEventId}
          userLocation={userLocation}
          nearMeActive={nearMeActive}
          nearMeRadiusKm={nearMeRadiusKm}
          centerOnUser={centerOnUser}
          className="h-full"
        />
      </div>

      <div className="order-2 flex min-h-0 flex-col">
        <div className="mb-3 shrink-0">
          <h2 className="text-lg font-semibold text-slate-950">Events</h2>
          <p className="text-sm text-slate-600">{total} matching events</p>
          {locationLoading ? (
            <p className="mt-1 text-xs text-slate-500">Getting your location for the map…</p>
          ) : locationError ? (
            <p className="mt-1 text-xs text-amber-700">Location unavailable: {locationError}</p>
          ) : userLocation ? (
            <p className="mt-1 text-xs text-slate-500">Your location is shown on the map (blue dot).</p>
          ) : null}
          {filters.happeningNow ? (
            <p className="mt-1 text-xs font-medium text-red-700">Showing live events only.</p>
          ) : null}
        </div>

        <div
          ref={listScrollRef}
          className={`${PANEL_HEIGHT} min-h-0 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3 shadow-inner`}
        >
          {events.length ? (
            <div className="space-y-3">
              {listSections.live.length ? (
                <section className="space-y-3">
                  <ListSectionHeader label="Happening now" />
                  {listSections.live.map(renderEvent)}
                </section>
              ) : null}
              {listSections.upcoming.length ? (
                <section className="space-y-3">
                  <ListSectionHeader label="Upcoming" />
                  {listSections.upcoming.map(renderEvent)}
                </section>
              ) : null}
              {listSections.ended.length ? (
                <section className="space-y-3">
                  <ListSectionHeader label="Ended" />
                  {listSections.ended.map(renderEvent)}
                </section>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="No events match these filters"
              description="Adjust filters or run ingestion after configuring Supabase."
            />
          )}
        </div>
      </div>
    </section>
  );
}
