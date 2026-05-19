"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NEAR_ME_DEFAULT_KM } from "@/lib/map-categories";

type UserLocation = { lat: number; lng: number };

type MapLocationContextValue = {
  userLocation: UserLocation | null;
  locationError: string | null;
  locationLoading: boolean;
  nearMeActive: boolean;
  nearMeRadiusKm: number;
  setNearMeActive: (active: boolean) => void;
  setNearMeDistance: (km: number) => void;
  requestLocation: () => void;
};

const MapLocationContext = createContext<MapLocationContextValue | null>(null);

function parseNearMeRadius(searchParams: URLSearchParams) {
  const fromUrl = Number(searchParams.get("maxDistanceKm"));
  if (Number.isFinite(fromUrl) && fromUrl > 0) {
    return fromUrl;
  }
  return NEAR_ME_DEFAULT_KM;
}

export function MapLocationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const nearMeActive = Boolean(searchParams.get("nearLat") && searchParams.get("nearLng"));
  const nearMeRadiusKm = parseNearMeRadius(searchParams);

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

  function pushParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    mutate(next);
    router.push(`/?${next.toString()}`);
  }

  function setNearMeActive(active: boolean) {
    if (!active) {
      pushParams((next) => {
        next.delete("nearLat");
        next.delete("nearLng");
        next.delete("maxDistanceKm");
      });
      return;
    }

    if (!userLocation) {
      requestLocation();
      return;
    }

    pushParams((next) => {
      next.set("nearLat", String(userLocation.lat));
      next.set("nearLng", String(userLocation.lng));
      if (!next.get("maxDistanceKm")) {
        next.set("maxDistanceKm", String(NEAR_ME_DEFAULT_KM));
      }
    });
  }

  function setNearMeDistance(km: number) {
    if (!nearMeActive) {
      if (!userLocation) {
        requestLocation();
        return;
      }
      pushParams((next) => {
        next.set("nearLat", String(userLocation.lat));
        next.set("nearLng", String(userLocation.lng));
        next.set("maxDistanceKm", String(km));
      });
      return;
    }

    pushParams((next) => {
      next.set("maxDistanceKm", String(km));
    });
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
      nearMeRadiusKm,
      setNearMeActive,
      setNearMeDistance,
      requestLocation
    }),
    [userLocation, locationError, locationLoading, nearMeActive, nearMeRadiusKm, requestLocation]
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
