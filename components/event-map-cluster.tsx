"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { formatEventDate } from "@/lib/utils";
import type { MapEventRecord } from "@/types/event";

type MarkerOptions = {
  events: MapEventRecord[];
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string) => void;
  now: number;
  createIcon: (categories: string[], isHappeningNow: boolean) => L.DivIcon;
};

export function EventMapCluster({ events, selectedEventId, onEventSelect, now, createIcon }: MarkerOptions) {
  const map = useMap();

  useEffect(() => {
    const cluster = (L as typeof L & { markerClusterGroup: () => L.MarkerClusterGroup }).markerClusterGroup();
    const markers: L.Marker[] = [];

    for (const event of events) {
      const startMs = new Date(event.start_at).getTime();
      const endMs = event.end_at ? new Date(event.end_at).getTime() : startMs + 3600000;
      const isHappeningNow = now >= startMs && now <= endMs;
      const icon = createIcon(event.categories, isHappeningNow);
      const location = event.location_text ?? event.venue_name ?? "Location TBD";

      const marker = L.marker([event.latitude!, event.longitude!], {
        icon,
        zIndexOffset: isHappeningNow ? 1000 : selectedEventId === event.id ? 500 : 0
      });

      marker.bindPopup(
        [
          '<div class="space-y-2">',
          `<p class="text-sm font-semibold text-slate-950">${isHappeningNow ? '<span class="text-red-500 font-bold">LIVE:</span> ' : ""}${event.title}</p>`,
          `<p class="text-xs text-slate-600">${formatEventDate(event.start_at, event.end_at)}</p>`,
          `<p class="text-xs text-slate-600">${location}</p>`,
          `<a href="/events/${event.slug}" class="text-xs font-medium text-brand-600">View details</a>`,
          "</div>"
        ].join("")
      );

      marker.on("click", () => onEventSelect?.(event.id));
      markers.push(marker);
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
    };
  }, [events, selectedEventId, onEventSelect, now, map, createIcon]);

  useEffect(() => {
    if (!selectedEventId) return;
    const selected = events.find((event) => event.id === selectedEventId);
    if (!selected?.latitude || !selected.longitude) return;
    map.panTo([selected.latitude, selected.longitude], { animate: true });
  }, [selectedEventId, events, map]);

  return null;
}
