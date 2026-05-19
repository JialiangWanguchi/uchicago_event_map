"use client";

import { Suspense } from "react";
import { EventExplorer } from "@/components/event-explorer";
import { EventFilters } from "@/components/event-filters";
import { EventFiltersSkeleton } from "@/components/event-filters-skeleton";
import { MapLocationProvider } from "@/components/map-location-context";
import type { EventFilters as Filters, EventRecord, MapEventRecord } from "@/types/event";

type Props = {
  events: EventRecord[];
  mapEvents: MapEventRecord[];
  savedEventIds: string[];
  canSave: boolean;
  filters: Filters;
  total: number;
};

export function ExploreShell(props: Props) {
  return (
    <MapLocationProvider>
      <Suspense fallback={<EventFiltersSkeleton />}>
        <EventFilters />
      </Suspense>
      <EventExplorer {...props} />
    </MapLocationProvider>
  );
}
