"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { CAMPUS_CENTER } from "@/lib/constants";
import { EventMapCluster } from "@/components/event-map-cluster";
import type { MapEventRecord } from "@/types/event";

type Props = {
  events: MapEventRecord[];
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string) => void;
};

function getCategoryColor(categories: string[]) {
  if (categories.includes("Academic")) return "#3b82f6";
  if (categories.includes("Arts")) return "#a855f7";
  if (categories.includes("Athletics")) return "#f97316";
  if (categories.includes("Social")) return "#10b981";
  if (categories.includes("Career")) return "#0ea5e9";
  return "#64748b";
}

export default function EventMapClient({ events, selectedEventId, onEventSelect }: Props) {
  const mappableEvents = events.filter((event) => event.latitude && event.longitude);
  const [now, setNow] = useState(Date.now());
  const [mapInteractive, setMapInteractive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const createIcon = useCallback((categories: string[], isHappeningNow: boolean) => {
    if (isHappeningNow) {
      return new L.DivIcon({
        html: `<div class="pulse-marker-wrapper"><div class="pulse-marker-ring"></div><div class="pulse-marker-dot"></div></div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    }

    const color = getCategoryColor(categories);
    return new L.DivIcon({
      html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Campus map</h2>
        <p className="mt-1 text-sm text-slate-600">
          Showing {mappableEvents.length} mapped events for your current filters.
        </p>
      </div>
      <div className="relative h-[680px] xl:h-[760px]">
        {!mapInteractive ? (
          <button
            type="button"
            className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-900/10 text-sm font-medium text-slate-800"
            onClick={() => setMapInteractive(true)}
          >
            Tap to interact with map
          </button>
        ) : null}
        <MapContainer
          center={CAMPUS_CENTER}
          zoom={15}
          scrollWheelZoom={mapInteractive}
          dragging={mapInteractive}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <EventMapCluster
            events={mappableEvents}
            selectedEventId={selectedEventId}
            onEventSelect={onEventSelect}
            now={now}
            createIcon={createIcon}
          />
        </MapContainer>
      </div>
    </div>
  );
}
