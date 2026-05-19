export type EventTimeStatus = "upcoming" | "live" | "ended";

export function getEventTimeStatus(
  event: { start_at: string; end_at: string | null },
  now = Date.now()
): EventTimeStatus {
  const startMs = new Date(event.start_at).getTime();
  const endMs = event.end_at ? new Date(event.end_at).getTime() : startMs + 3600000;

  if (now < startMs) return "upcoming";
  if (now <= endMs) return "live";
  return "ended";
}

/** Live (latest start first) → upcoming (soonest first) → ended (earlier end first). */
export function sortEventsForDisplay<T extends { start_at: string; end_at: string | null }>(
  events: T[],
  now = Date.now()
): T[] {
  const live: T[] = [];
  const upcoming: T[] = [];
  const ended: T[] = [];

  for (const event of events) {
    const status = getEventTimeStatus(event, now);
    if (status === "live") live.push(event);
    else if (status === "upcoming") upcoming.push(event);
    else ended.push(event);
  }

  live.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
  upcoming.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  ended.sort((a, b) => {
    const aEnd = a.end_at ? new Date(a.end_at).getTime() : new Date(a.start_at).getTime();
    const bEnd = b.end_at ? new Date(b.end_at).getTime() : new Date(b.start_at).getTime();
    return aEnd - bEnd;
  });

  return [...live, ...upcoming, ...ended];
}

export function formatCountdownToStart(startAt: string, now = Date.now()) {
  const diffMs = new Date(startAt).getTime() - now;
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes}m`;
}

export function mapEventToPreview(
  event: Pick<
    import("@/types/event").MapEventRecord,
    "id" | "slug" | "title" | "start_at" | "end_at" | "categories" | "location_text" | "venue_name" | "latitude" | "longitude" | "geocode_source"
  >
): import("@/types/event").EventRecord {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: null,
    description: null,
    start_at: event.start_at,
    end_at: event.end_at,
    timezone: "America/Chicago",
    source_url: `/events/${event.slug}`,
    image_url: null,
    venue_name: event.venue_name,
    address: null,
    location_text: event.location_text,
    latitude: event.latitude,
    longitude: event.longitude,
    geocode_source: event.geocode_source ?? null,
    categories: event.categories,
    tags: [],
    source_updated_at: null,
    imported_at: new Date().toISOString()
  };
}
