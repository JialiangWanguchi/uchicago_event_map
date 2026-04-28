import { resolveCoordinates } from "@/lib/geocode";
import { slugify, stripHtml } from "@/lib/utils";
import type { LocalistResponse } from "@/lib/localist";

type FeedItem = LocalistResponse["events"][number]["event"];

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
  const fallbackGeo =
    item.latitude && item.longitude
      ? { lat: item.latitude, lng: item.longitude }
      : await resolveCoordinates(item.location, null);

  const summary = stripHtml(item.description).slice(0, 220) || null;
  const instanceId = `${item.id}-${startAt}`;
  const tags = Array.from(new Set([...item.audience, ...item.campus]));

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
    latitude: fallbackGeo.lat,
    longitude: fallbackGeo.lng,
    categories: item.categories,
    tags,
    raw_payload: item,
    source_updated_at: null,
    imported_at: new Date().toISOString()
  };
}
