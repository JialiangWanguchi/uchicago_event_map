import { BUILDING_COORDINATES, CAMPUS_CENTER } from "@/lib/constants";
import { env } from "@/lib/env";

type Coordinates = { lat: number; lng: number; source: "lookup" | "geocoder" | "fallback" };

function normalizeVenue(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export async function resolveCoordinates(venue?: string | null, address?: string | null): Promise<Coordinates> {
  const normalizedVenue = normalizeVenue(venue);

  if (normalizedVenue) {
    for (const [key, value] of Object.entries(BUILDING_COORDINATES)) {
      if (normalizedVenue.includes(key)) {
        return { ...value, source: "lookup" };
      }
    }
  }

  const query = [venue, address, "University of Chicago campus"].filter(Boolean).join(", ");

  if (query) {
    const geocoded = await geocodeWithNominatim(query);
    if (geocoded) {
      return { ...geocoded, source: "geocoder" };
    }
  }

  return { lat: CAMPUS_CENTER[0], lng: CAMPUS_CENTER[1], source: "fallback" };
}

async function geocodeWithNominatim(query: string) {
  try {
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
