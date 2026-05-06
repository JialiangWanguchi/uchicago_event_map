"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { CAMPUS_CENTER } from "@/lib/constants";
import { formatEventDate } from "@/lib/utils";
import type { EventRecord } from "@/types/event";

type Props = {
  events: EventRecord[];
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string) => void;
};

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function EventMapClient({ events, selectedEventId, onEventSelect }: Props) {
  const mappableEvents = events.filter((event) => event.latitude && event.longitude);

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
          {mappableEvents.map((event) => (
            <Marker
              key={event.id}
              position={[event.latitude!, event.longitude!]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onEventSelect?.(event.id)
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-950">
                    {selectedEventId === event.id ? "Selected: " : ""}
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
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
