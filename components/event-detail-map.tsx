"use client";

import dynamic from "next/dynamic";
import type { EventRecord } from "@/types/event";

const EventDetailMapClient = dynamic(() => import("@/components/event-detail-map-client"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-lg bg-slate-100" />
});

export function EventDetailMap({ event }: { event: EventRecord }) {
  if (event.latitude == null || event.longitude == null) {
    return null;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
      <EventDetailMapClient event={event} />
    </div>
  );
}
