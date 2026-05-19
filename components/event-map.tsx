"use client";

import dynamic from "next/dynamic";
import type { MapEventRecord } from "@/types/event";

type Props = {
  events: MapEventRecord[];
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  nearMeActive?: boolean;
  nearMeRadiusKm?: number;
  centerOnUser?: boolean;
  className?: string;
};

const EventMapClient = dynamic(() => import("@/components/event-map-client"), {
  ssr: false,
  loading: () => (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Campus map</h2>
        <p className="mt-1 text-sm text-slate-600">Loading map...</p>
      </div>
      <div className="h-[680px] bg-slate-100 xl:h-[760px]" />
    </div>
  )
});

export function EventMap(props: Props) {
  return <EventMapClient {...props} />;
}
