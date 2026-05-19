"use client";

import { useEffect } from "react";
import { Circle, CircleMarker, useMap } from "react-leaflet";

type Props = {
  userLocation: { lat: number; lng: number } | null;
  nearMeActive: boolean;
  radiusKm: number;
  centerOnUser?: boolean;
};

export function MapUserLayer({ userLocation, nearMeActive, radiusKm, centerOnUser }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || !centerOnUser) return;
    map.setView([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 15), { animate: true });
  }, [userLocation, centerOnUser, map]);

  if (!userLocation) return null;

  return (
    <>
      <CircleMarker
        center={[userLocation.lat, userLocation.lng]}
        radius={9}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
      />
      <CircleMarker
        center={[userLocation.lat, userLocation.lng]}
        radius={16}
        pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.2 }}
      />
      {nearMeActive ? (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#10b981",
            fillColor: "#10b981",
            fillOpacity: 0.12,
            weight: 2,
            dashArray: "6 4"
          }}
        />
      ) : null}
    </>
  );
}
