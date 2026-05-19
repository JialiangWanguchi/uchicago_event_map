"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MAP_CLUSTER_DISABLE_ZOOM } from "@/lib/map-categories";
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
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const onEventSelectRef = useRef(onEventSelect);
  onEventSelectRef.current = onEventSelect;

  useEffect(() => {
    const clusterGroup = (
      L as typeof L & {
        markerClusterGroup: (options?: L.MarkerClusterGroupOptions) => L.MarkerClusterGroup;
      }
    ).markerClusterGroup({
      disableClusteringAtZoom: MAP_CLUSTER_DISABLE_ZOOM,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: false,
      spiderfyOnEveryZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      animateAddingMarkers: false
    });

    markersByIdRef.current.clear();

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

      marker.on("click", (leafletEvent) => {
        L.DomEvent.stopPropagation(leafletEvent);
        onEventSelectRef.current?.(event.id);
      });

      markersByIdRef.current.set(event.id, marker);
      clusterGroup.addLayer(marker);
    }

    clusterGroup.on("clusterclick", (clusterEvent: L.LeafletEvent) => {
      if (map.getZoom() >= MAP_CLUSTER_DISABLE_ZOOM) return;
      const latlng = (clusterEvent as L.LeafletEvent & { latlng?: L.LatLng }).latlng;
      if (!latlng) return;
      map.setView(latlng, MAP_CLUSTER_DISABLE_ZOOM, { animate: true });
    });

    map.addLayer(clusterGroup as L.Layer);

    return () => {
      map.removeLayer(clusterGroup as L.Layer);
      markersByIdRef.current.clear();
    };
  }, [events, now, map, createIcon, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    const selected = events.find((event) => event.id === selectedEventId);
    if (!selected?.latitude || !selected.longitude) return;

    map.panTo([selected.latitude, selected.longitude], { animate: true });

    const marker = markersByIdRef.current.get(selectedEventId);
    if (marker) {
      window.setTimeout(() => marker.openPopup(), 250);
    }
  }, [selectedEventId, events, map]);

  return null;
}
