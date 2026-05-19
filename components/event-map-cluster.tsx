"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MAP_CLUSTER_DISABLE_ZOOM } from "@/lib/map-categories";
import { getEventTimeStatus, type EventTimeStatus } from "@/lib/event-status";
import { formatEventDate } from "@/lib/utils";
import type { MapEventRecord } from "@/types/event";

type MarkerOptions = {
  events: MapEventRecord[];
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string) => void;
  now: number;
  createIcon: (categories: string[], status: EventTimeStatus, isSelected: boolean) => L.DivIcon;
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
      const status = getEventTimeStatus(event, now);
      const isSelected = selectedEventId === event.id;
      const icon = createIcon(event.categories, status, isSelected);
      const location = event.location_text ?? event.venue_name ?? "Location TBD";

      const marker = L.marker([event.latitude!, event.longitude!], {
        icon,
        zIndexOffset: isSelected ? 2000 : status === "live" ? 1000 : status === "upcoming" ? 100 : 0
      });

      marker.bindPopup(
        [
          '<div class="space-y-2">',
          `<p class="text-sm font-semibold text-slate-950">${status === "live" ? '<span class="text-red-500 font-bold">LIVE:</span> ' : ""}${event.title}</p>`,
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

    const targetZoom = Math.max(map.getZoom(), MAP_CLUSTER_DISABLE_ZOOM);
    map.flyTo([selected.latitude, selected.longitude], targetZoom, { animate: true, duration: 0.45 });

    const marker = markersByIdRef.current.get(selectedEventId);
    if (marker) {
      window.setTimeout(() => marker.openPopup(), 400);
    }
  }, [selectedEventId, events, map]);

  return null;
}
