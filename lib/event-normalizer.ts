import { resolveCoordinates } from "@/lib/geocode";
import { slugify, stripHtml } from "@/lib/utils";
import type { fetchAllLocalistEvents } from "@/lib/localist";
import type { GeocodeSource } from "@/types/event";

type FeedItem = Awaited<ReturnType<typeof fetchAllLocalistEvents>>[number];

function toIsoString(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function normalizeLocalistEvent(item: FeedItem) {
  const title = item.title.trim();
  const startAt = toIsoString(item.pubDate);

  if (!startAt) {
    throw new Error(`Missing valid event start time for ${item.id}`);
  }

  const endAt = toIsoString(item.ends);
  const upstreamGeo =
    item.latitude && item.longitude ? { lat: item.latitude, lng: item.longitude } : null;
  const resolved = await resolveCoordinates(item.location, null, upstreamGeo);

  const summary = stripHtml(item.description).slice(0, 220) || null;
  const instanceId = `${item.id}-${startAt}`;
  const tags = Array.from(new Set([...item.audience, ...item.campus]));

  const latitude = resolved.source === "none" ? null : resolved.lat;
  const longitude = resolved.source === "none" ? null : resolved.lng;

  return {
    id: instanceId,
    slug: `${slugify(title)}-${item.id}-${startAt.slice(0, 10)}`,
    title,
    summary,
    description: item.description ? stripHtml(item.description) : null,
    start_at: startAt,
    end_at: endAt,
    timezone: item.timezone ?? "America/Chicago",
    source_url: item.url,
    image_url: item.imageUrl,
    venue_name: item.location,
    address: null,
    location_text: item.location,
    latitude,
    longitude,
    geocode_source: resolved.source as GeocodeSource,
    categories: item.categories,
    tags,
    raw_payload: item,
    source_updated_at: null,
    imported_at: new Date().toISOString()
  };
}
