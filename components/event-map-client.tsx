"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { CAMPUS_CENTER } from "@/lib/constants";
import { getCategoryColor, MAP_ENDED_COLOR } from "@/lib/map-categories";
import type { EventTimeStatus } from "@/lib/event-status";
import { EventMapCluster } from "@/components/event-map-cluster";
import { MapLegend } from "@/components/map-legend";
import { MapUserLayer } from "@/components/map-user-layer";
import { cn } from "@/lib/utils";
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

export default function EventMapClient({
  events,
  selectedEventId,
  onEventSelect,
  userLocation = null,
  nearMeActive = false,
  nearMeRadiusKm = 1,
  centerOnUser = false,
  className
}: Props) {
  const mappableEvents = events.filter((event) => event.latitude && event.longitude);
  const [now, setNow] = useState(Date.now());
  const mapCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : CAMPUS_CENTER;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const createIcon = useCallback((categories: string[], status: EventTimeStatus, isSelected: boolean) => {
    if (status === "live") {
      const scale = isSelected ? "scale(1.15)" : "scale(1)";
      return new L.DivIcon({
        html: `<div class="pulse-marker-wrapper" style="transform:${scale}"><div class="pulse-marker-ring"></div><div class="pulse-marker-dot"></div></div>`,
        className: isSelected ? "map-marker-selected" : "",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    }

    const color = status === "ended" ? MAP_ENDED_COLOR : getCategoryColor(categories);
    const size = isSelected ? 20 : 16;
    const anchor = size / 2;
    const ring = isSelected
      ? "box-shadow: 0 0 0 3px #fbbf24, 0 0 0 6px rgba(251, 191, 36, 0.45), 0 2px 6px rgba(0,0,0,0.35);"
      : "box-shadow: 0 1px 3px rgba(0,0,0,0.3);";

    return new L.DivIcon({
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; ${ring}"></div>`,
      className: isSelected ? "map-marker-selected" : "",
      iconSize: [size, size],
      iconAnchor: [anchor, anchor]
    });
  }, []);

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel", className)}>
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Campus map</h2>
        <p className="mt-1 text-sm text-slate-600">
          Drag to pan, scroll to zoom. Markers split automatically when you zoom in. {mappableEvents.length} events on
          map.
          {userLocation ? " Your location is marked in blue." : ""}
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
        <MapContainer
          center={mapCenter}
          zoom={15}
          scrollWheelZoom
          dragging
          touchZoom
          doubleClickZoom
          zoomControl
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUserLayer
            userLocation={userLocation}
            nearMeActive={nearMeActive}
            radiusKm={nearMeRadiusKm}
            centerOnUser={centerOnUser}
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
      <MapLegend />
    </div>
  );
}
