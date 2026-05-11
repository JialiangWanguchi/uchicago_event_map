"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { CAMPUS_CENTER } from "@/lib/constants";
import { formatEventDate } from "@/lib/utils";
import type { EventRecord } from "@/types/event";

type Props = {
  events: EventRecord[];
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string) => void;
};

function getCategoryColor(categories: string[]) {
  if (categories.includes("Academic")) return "#3b82f6"; // blue-500
  if (categories.includes("Arts")) return "#a855f7"; // purple-500
  if (categories.includes("Athletics")) return "#f97316"; // orange-500
  if (categories.includes("Social")) return "#10b981"; // emerald-500
  if (categories.includes("Career")) return "#0ea5e9"; // sky-500
  return "#64748b"; // slate-500 default
}

function createCustomIcon(categories: string[], isHappeningNow: boolean) {
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
}

export default function EventMapClient({ events, selectedEventId, onEventSelect }: Props) {
  const mappableEvents = events.filter((event) => event.latitude && event.longitude);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // Update "now" every minute to keep pulse accurate
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Campus map</h2>
        <p className="mt-1 text-sm text-slate-600">Markers show events with resolved coordinates.</p>
      </div>
      <div className="h-[680px] xl:h-[760px]">
        <MapContainer center={CAMPUS_CENTER} zoom={15} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mappableEvents.map((event) => {
            const startMs = new Date(event.start_at).getTime();
            const endMs = event.end_at ? new Date(event.end_at).getTime() : startMs + 3600000; // default 1 hr
            const isHappeningNow = now >= startMs && now <= endMs;
            const icon = createCustomIcon(event.categories, isHappeningNow);

            return (
              <Marker
                key={event.id}
                position={[event.latitude!, event.longitude!]}
                icon={icon}
                eventHandlers={{
                  click: () => onEventSelect?.(event.id)
                }}
                zIndexOffset={isHappeningNow ? 1000 : 0}
              >
                <Popup>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-950">
                      {isHappeningNow && <span className="text-red-500 mr-1 font-bold">LIVE:</span>}
                      {selectedEventId === event.id && !isHappeningNow ? "Selected: " : ""}
                      {event.title}
                    </div>
                    <div className="text-xs text-slate-600">{formatEventDate(event.start_at, event.end_at)}</div>
                    <div className="text-xs text-slate-600">{event.location_text ?? event.venue_name ?? "Location TBD"}</div>
                    <Link href={`/events/${event.slug}`} className="text-xs font-medium text-brand-600">
                      View details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
