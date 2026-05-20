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

type LWithCluster = typeof L & {
  markerClusterGroup: (options?: L.MarkerClusterGroupOptions) => L.MarkerClusterGroup;
};

type LocationGroup = {
  key: string;
  lat: number;
  lng: number;
  events: MapEventRecord[];
};

/** Round to ~1.1m precision so events truly at the "same place" cluster together. */
function coordKey(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function groupByCoord(events: MapEventRecord[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>();
  for (const event of events) {
    if (event.latitude == null || event.longitude == null) continue;
    const key = coordKey(event.latitude, event.longitude);
    let group = map.get(key);
    if (!group) {
      group = { key, lat: event.latitude, lng: event.longitude, events: [] };
      map.set(key, group);
    }
    group.events.push(event);
  }
  return Array.from(map.values());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPopupHtml(group: LocationGroup, activeIndex: number, now: number) {
  const event = group.events[activeIndex];
  const status = getEventTimeStatus(event, now);
  const location = event.location_text ?? event.venue_name ?? "Location TBD";
  const hasMultiple = group.events.length > 1;

  const header = hasMultiple
    ? `<div class="flex items-center justify-between mb-2 gap-2">
        <button type="button" data-popup-nav="prev" class="rounded-md border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100" aria-label="Previous event">&larr;</button>
        <span class="text-xs font-medium text-slate-600">${activeIndex + 1} / ${group.events.length} at this spot</span>
        <button type="button" data-popup-nav="next" class="rounded-md border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100" aria-label="Next event">&rarr;</button>
      </div>`
    : "";

  const livePrefix = status === "live" ? '<span class="text-red-500 font-bold">LIVE: </span>' : "";

  return `<div class="space-y-2 min-w-[200px]">
    ${header}
    <p class="text-sm font-semibold text-slate-950">${livePrefix}${escapeHtml(event.title)}</p>
    <p class="text-xs text-slate-600">${escapeHtml(formatEventDate(event.start_at, event.end_at))}</p>
    <p class="text-xs text-slate-600">${escapeHtml(location)}</p>
    <a href="/events/${event.slug}" class="text-xs font-medium text-brand-600">View details</a>
  </div>`;
}

export function EventMapCluster({ events, selectedEventId, onEventSelect, now, createIcon }: MarkerOptions) {
  const map = useMap();
  const markersByGroupKeyRef = useRef<Map<string, L.Marker>>(new Map());
  const groupsRef = useRef<LocationGroup[]>([]);
  const groupKeyByEventIdRef = useRef<Map<string, string>>(new Map());
  const activeIndexByGroupKeyRef = useRef<Map<string, number>>(new Map());
  const onEventSelectRef = useRef(onEventSelect);

  onEventSelectRef.current = onEventSelect;

  function getActiveIndex(groupKey: string) {
    return activeIndexByGroupKeyRef.current.get(groupKey) ?? 0;
  }

  function refreshMarker(group: LocationGroup, opts: { fromUserNavigation?: boolean } = {}) {
    const marker = markersByGroupKeyRef.current.get(group.key);
    if (!marker) return;

    const activeIndex = getActiveIndex(group.key);
    const event = group.events[activeIndex];
    const status = getEventTimeStatus(event, now);
    const isSelected = selectedEventId === event.id;

    marker.setIcon(createIcon(event.categories, status, isSelected));
    marker.setZIndexOffset(isSelected ? 2000 : status === "live" ? 1000 : status === "upcoming" ? 100 : 0);
    marker.setPopupContent(buildPopupHtml(group, activeIndex, now));

    if (opts.fromUserNavigation) {
      onEventSelectRef.current?.(event.id);
    }
  }

  function bindPopupNavigation(marker: L.Marker, group: LocationGroup) {
    marker.on("popupopen", (e) => {
      const popupNode = (e as L.PopupEvent).popup.getElement();
      if (!popupNode) return;

      const handler = (ev: Event) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;
        const nav = target.closest("[data-popup-nav]") as HTMLElement | null;
        if (!nav) return;
        ev.preventDefault();
        ev.stopPropagation();

        const direction = nav.getAttribute("data-popup-nav");
        const current = getActiveIndex(group.key);
        const total = group.events.length;
        const next = direction === "next" ? (current + 1) % total : (current - 1 + total) % total;
        activeIndexByGroupKeyRef.current.set(group.key, next);
        refreshMarker(group, { fromUserNavigation: true });
      };

      popupNode.addEventListener("click", handler);
      marker.once("popupclose", () => {
        popupNode.removeEventListener("click", handler);
      });
    });
  }

  // Rebuild the cluster when the event set or clock changes — NOT on selection.
  useEffect(() => {
    const clusterGroup = (L as LWithCluster).markerClusterGroup({
      disableClusteringAtZoom: MAP_CLUSTER_DISABLE_ZOOM,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: false,
      spiderfyOnEveryZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      animateAddingMarkers: false
    });

    const groups = groupByCoord(events);
    groupsRef.current = groups;
    markersByGroupKeyRef.current.clear();
    groupKeyByEventIdRef.current.clear();

    // Preserve previous active indices where possible; default new groups to 0.
    const prevActive = activeIndexByGroupKeyRef.current;
    const nextActive = new Map<string, number>();

    for (const group of groups) {
      const prevIndex = prevActive.get(group.key);
      const validIndex = prevIndex != null && prevIndex < group.events.length ? prevIndex : 0;
      nextActive.set(group.key, validIndex);

      for (const event of group.events) {
        groupKeyByEventIdRef.current.set(event.id, group.key);
      }

      // If the selected event lives in this group, focus that index.
      if (selectedEventId) {
        const idx = group.events.findIndex((e) => e.id === selectedEventId);
        if (idx !== -1) nextActive.set(group.key, idx);
      }

      const activeIndex = nextActive.get(group.key)!;
      const activeEvent = group.events[activeIndex];
      const status = getEventTimeStatus(activeEvent, now);
      const isSelected = selectedEventId === activeEvent.id;

      const marker = L.marker([group.lat, group.lng], {
        icon: createIcon(activeEvent.categories, status, isSelected),
        zIndexOffset: isSelected ? 2000 : status === "live" ? 1000 : status === "upcoming" ? 100 : 0
      });

      marker.bindPopup(buildPopupHtml(group, activeIndex, now), { maxWidth: 280, minWidth: 220 });
      bindPopupNavigation(marker, group);

      marker.on("click", (leafletEvent) => {
        L.DomEvent.stopPropagation(leafletEvent);
        const idx = getActiveIndex(group.key);
        onEventSelectRef.current?.(group.events[idx].id);
      });

      markersByGroupKeyRef.current.set(group.key, marker);
      clusterGroup.addLayer(marker);
    }

    activeIndexByGroupKeyRef.current = nextActive;

    clusterGroup.on("clusterclick", (clusterEvent: L.LeafletEvent) => {
      if (map.getZoom() >= MAP_CLUSTER_DISABLE_ZOOM) return;
      const latlng = (clusterEvent as L.LeafletEvent & { latlng?: L.LatLng }).latlng;
      if (!latlng) return;
      map.setView(latlng, MAP_CLUSTER_DISABLE_ZOOM, { animate: true });
    });

    map.addLayer(clusterGroup as L.Layer);

    return () => {
      map.removeLayer(clusterGroup as L.Layer);
      markersByGroupKeyRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, now, map, createIcon]);

  // When the parent changes selection (via list click), sync the corresponding marker.
  useEffect(() => {
    if (!selectedEventId) return;
    const groupKey = groupKeyByEventIdRef.current.get(selectedEventId);
    if (!groupKey) return;

    const group = groupsRef.current.find((g) => g.key === groupKey);
    if (!group) return;

    const idx = group.events.findIndex((e) => e.id === selectedEventId);
    if (idx === -1) return;

    const previousActive = getActiveIndex(groupKey);
    if (previousActive !== idx) {
      activeIndexByGroupKeyRef.current.set(groupKey, idx);
    }

    // Update icons for all groups so selection ring follows the selected event.
    for (const g of groupsRef.current) {
      refreshMarker(g);
    }

    const marker = markersByGroupKeyRef.current.get(groupKey);
    if (!marker) return;

    const targetZoom = Math.max(map.getZoom(), MAP_CLUSTER_DISABLE_ZOOM);
    map.flyTo([group.lat, group.lng], targetZoom, { animate: true, duration: 0.4 });
    window.setTimeout(() => marker.openPopup(), 420);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, map]);

  return null;
}
