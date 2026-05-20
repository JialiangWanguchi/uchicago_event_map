import { BUILDING_COORDINATES, CAMPUS_CENTER, VIRTUAL_LOCATION_PATTERN } from "@/lib/constants";
import { env } from "@/lib/env";
import type { GeocodeSource } from "@/types/event";

type Coordinates = { lat: number; lng: number; source: GeocodeSource };

let lastNominatimCall = 0;

function normalizeVenue(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function isVirtualLocation(venue?: string | null) {
  return VIRTUAL_LOCATION_PATTERN.test(venue ?? "");
}

async function waitForNominatimSlot() {
  const minGapMs = 1100;
  const elapsed = Date.now() - lastNominatimCall;
  if (elapsed < minGapMs) {
    await new Promise((resolve) => setTimeout(resolve, minGapMs - elapsed));
  }
  lastNominatimCall = Date.now();
}

export async function resolveCoordinates(
  venue?: string | null,
  address?: string | null,
  upstream?: { lat: number; lng: number } | null,
  options: { enableRemoteGeocoder?: boolean } = {}
): Promise<Coordinates> {
  if (isVirtualLocation(venue) || isVirtualLocation(address)) {
    return { lat: 0, lng: 0, source: "none" };
  }

  if (upstream?.lat && upstream?.lng) {
    return { lat: upstream.lat, lng: upstream.lng, source: "upstream" };
  }

  const normalizedVenue = normalizeVenue(venue);

  if (normalizedVenue) {
    const sortedKeys = Object.keys(BUILDING_COORDINATES).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (normalizedVenue.includes(key)) {
        return { ...BUILDING_COORDINATES[key], source: "lookup" };
      }
    }
  }

  // Remote Nominatim is rate-limited to 1 req/sec by policy and balloons ingest past Vercel's
  // function timeout. Disabled by default; opt-in via flag for offline jobs.
  if (options.enableRemoteGeocoder) {
    const query = [venue, address, "University of Chicago campus"].filter(Boolean).join(", ");
    if (query) {
      const geocoded = await geocodeWithNominatim(query);
      if (geocoded) {
        return { ...geocoded, source: "geocoder" };
      }
    }
  }

  return { lat: CAMPUS_CENTER[0], lng: CAMPUS_CENTER[1], source: "fallback" };
}

async function geocodeWithNominatim(query: string) {
  try {
    await waitForNominatimSlot();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": `campus-event-map/1.0 (${env.nominatimEmail ?? "no-contact-provided"})`
        },
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) {
      return null;
    }

    return {
      lat: Number(first.lat),
      lng: Number(first.lon)
    };
  } catch {
    return null;
  }
}

export function geocodeSourceLabel(source: GeocodeSource | null | undefined) {
  switch (source) {
    case "lookup":
      return "Campus building match";
    case "upstream":
      return "Official coordinates";
    case "geocoder":
      return "Geocoded address";
    case "fallback":
      return "Approximate campus location";
    case "none":
      return "Online / no map pin";
    default:
      return null;
  }
}
