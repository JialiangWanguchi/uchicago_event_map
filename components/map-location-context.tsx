"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NEAR_ME_RADIUS_KM } from "@/lib/map-categories";

type UserLocation = { lat: number; lng: number };

type MapLocationContextValue = {
  userLocation: UserLocation | null;
  locationError: string | null;
  locationLoading: boolean;
  nearMeActive: boolean;
  nearMeRadiusKm: number;
  setNearMeActive: (active: boolean) => void;
  requestLocation: () => void;
};

const MapLocationContext = createContext<MapLocationContextValue | null>(null);

export function MapLocationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const nearMeActive = Boolean(searchParams.get("nearLat") && searchParams.get("nearLng"));

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message || "Could not access your location.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  function setNearMeActive(active: boolean) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");

    if (!active) {
      next.delete("nearLat");
      next.delete("nearLng");
      next.delete("maxDistanceKm");
      router.push(`/?${next.toString()}`);
      return;
    }

    if (!userLocation) {
      requestLocation();
      return;
    }

    next.set("nearLat", String(userLocation.lat));
    next.set("nearLng", String(userLocation.lng));
    next.set("maxDistanceKm", String(NEAR_ME_RADIUS_KM));
    router.push(`/?${next.toString()}`);
  }

  useEffect(() => {
    if (!nearMeActive || userLocation) return;
    requestLocation();
  }, [nearMeActive, userLocation, requestLocation]);

  const value = useMemo(
    () => ({
      userLocation,
      locationError,
      locationLoading,
      nearMeActive,
      nearMeRadiusKm: NEAR_ME_RADIUS_KM,
      setNearMeActive,
      requestLocation
    }),
    [userLocation, locationError, locationLoading, nearMeActive, requestLocation]
  );

  return <MapLocationContext.Provider value={value}>{children}</MapLocationContext.Provider>;
}

export function useMapLocation() {
  const context = useContext(MapLocationContext);
  if (!context) {
    throw new Error("useMapLocation must be used within MapLocationProvider");
  }
  return context;
}
