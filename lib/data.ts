import { ARCHIVE_DAYS_AFTER_END, LIST_EVENTS_LIMIT } from "@/lib/constants";
import { buildEmbeddingText, embeddingHash } from "@/lib/embed-text";
import { getEventTimeStatus, sortEventsForDisplay } from "@/lib/event-status";
import { filterByMaxDistance, haversineKm, sortByDistance } from "@/lib/geo-utils";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { rpcMatchEvents } from "@/lib/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllLocalistEvents } from "@/lib/localist";
import { normalizeLocalistEvent } from "@/lib/event-normalizer";
import { hasSavedEventsConfig, hasSupabaseAdminConfig, hasSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";
import type { EventFilters, EventListResult, EventRecord, MapEventRecord, SemanticSearchResult } from "@/types/event";

type EventsRow = Database["public"]["Tables"]["events"]["Row"];

function logDbError(context: string, error: unknown) {
  console.error(`[campus-event-map] ${context}:`, error);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyEventFilters(query: any, filters: EventFilters) {
  let q = query;

  if (filters.dateFrom) {
    // User explicitly set a start date; respect it.
    q = q.gte("start_at", filters.dateFrom);
  } else {
    // No user filter: include anything still live or upcoming (end_at >= now), plus events
    // that ended within the last 3 days for the "Ended" section. The OR ensures we never
    // drop a multi-day live event whose start_at is in the past.
    const nowIso = new Date().toISOString();
    const threeDaysAgoIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    q = q.or(`end_at.gte.${nowIso},and(end_at.is.null,start_at.gte.${threeDaysAgoIso}),end_at.gte.${threeDaysAgoIso}`);
  }

  if (filters.dateTo) {
    q = q.lte("start_at", `${filters.dateTo}T23:59:59`);
  }

  if (filters.q) {
    const escaped = filters.q.replace(/[%_]/g, "");
    q = q.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%,venue_name.ilike.%${escaped}%`);
  }

  if (filters.category) {
    q = q.overlaps("categories", [filters.category]);
  }

  return q;
}

function attachDistance(events: EventRecord[], nearLat?: number, nearLng?: number): EventRecord[] {
  if (nearLat == null || nearLng == null) {
    return events;
  }

  return events.map((event) => {
    if (event.latitude == null || event.longitude == null) {
      return event;
    }
    return {
      ...event,
      distance_km: haversineKm(nearLat, nearLng, event.latitude, event.longitude)
    };
  });
}

function applyNearMeFilters(events: EventRecord[], filters: EventFilters) {
  let result = attachDistance(events, filters.nearLat, filters.nearLng);

  if (filters.nearLat != null && filters.nearLng != null && filters.maxDistanceKm) {
    result = filterByMaxDistance(result, filters.nearLat, filters.nearLng, filters.maxDistanceKm);
  }

  return result;
}

/** True if an event has any user-visible location text (not just "Location TBD"). */
function hasKnownLocation(event: Pick<EventRecord, "location_text" | "venue_name">) {
  const text = (event.location_text ?? event.venue_name ?? "").trim();
  return text.length > 0;
}

function finalizeEventsList(events: EventRecord[], filters: EventFilters): EventRecord[] {
  const located = events.filter(hasKnownLocation);
  return sortEventsForDisplay(applyNearMeFilters(located, filters));
}

function listResult(events: EventRecord[]): EventListResult {
  return {
    events,
    total: events.length,
    page: 1,
    pageSize: events.length
  };
}

export async function getEvents(filters: EventFilters = {}): Promise<EventListResult> {
  if (!hasSupabaseConfig()) {
    return listResult([]);
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return listResult([]);
  }

  let query = client.from("events").select("*").order("start_at", { ascending: true }).limit(LIST_EVENTS_LIMIT);
  query = applyEventFilters(query, filters);

  const { data, error } = await query;
  if (error) {
    logDbError("getEvents", error);
    return listResult([]);
  }

  return listResult(finalizeEventsList((data ?? []) as EventRecord[], filters));
}

export async function getMapEvents(filters: EventFilters = {}): Promise<MapEventRecord[]> {
  if (!hasSupabaseConfig()) {
    return [];
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return [];
  }

  let query = client
    .from("events")
    .select("id, slug, title, start_at, end_at, latitude, longitude, categories, location_text, venue_name")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("start_at", { ascending: true })
    .limit(LIST_EVENTS_LIMIT);

  query = applyEventFilters(query, filters);

  const { data, error } = await query;
  if (error) {
    logDbError("getMapEvents", error);
    return [];
  }

  let events = (data ?? []) as MapEventRecord[];

  // Drop pinless and "Location TBD" entries from the map.
  events = events.filter(hasKnownLocation);

  if (!filters.showEnded) {
    events = events.filter((event) => getEventTimeStatus(event) !== "ended");
  }

  if (filters.nearLat != null && filters.nearLng != null) {
    if (filters.maxDistanceKm) {
      events = filterByMaxDistance(events, filters.nearLat, filters.nearLng, filters.maxDistanceKm);
    }
    events = sortByDistance(events, filters.nearLat, filters.nearLng);
  }

  return events;
}

export async function getEventBySlug(slug: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client.from("events").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    throw error;
  }

  return (data as EventRecord | null) ?? null;
}

export async function searchEventsSemantic(query: string, count = 10): Promise<SemanticSearchResult[]> {
  if (!hasSupabaseConfig() || !query.trim()) {
    return [];
  }

  const { generateEmbedding } = await import("@/lib/ai");
  const embedding = await generateEmbedding(query);
  if (!embedding) {
    return [];
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await rpcMatchEvents(client, {
    query_embedding: embedding,
    match_threshold: 0.35,
    match_count: count,
    exclude_id: null
  });

  if (error) {
    logDbError("searchEventsSemantic", error);
    return [];
  }

  return (data ?? []) as SemanticSearchResult[];
}

export async function getSavedEventIds(userId: string | null) {
  if (!userId || !hasSavedEventsConfig()) {
    return new Set<string>();
  }

  try {
    const client = createAdminSupabaseClient();
    const { data, error } = await client.from("saved_events").select("event_id").eq("user_id", userId);
    if (error) {
      logDbError("getSavedEventIds", error);
      return new Set<string>();
    }

    return new Set(((data ?? []) as Database["public"]["Tables"]["saved_events"]["Row"][]).map((row) => row.event_id));
  } catch (error) {
    logDbError("getSavedEventIds", error);
    return new Set<string>();
  }
}

export async function getSavedEvents(userId: string | null) {
  if (!userId || !hasSavedEventsConfig()) {
    return [];
  }

  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("saved_events")
    .select("event_id, events(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{ events: EventRecord | null }>)
    .map((row) => row.events)
    .filter(Boolean) as EventRecord[];
}

export async function setSavedEvent(userId: string, eventId: string, save: boolean) {
  const client = createAdminSupabaseClient();

  if (save) {
    const { error } = await client.from("saved_events").upsert(
      {
        user_id: userId,
        event_id: eventId
      } as Database["public"]["Tables"]["saved_events"]["Insert"],
      { onConflict: "user_id,event_id", ignoreDuplicates: true }
    );

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await client.from("saved_events").delete().eq("user_id", userId).eq("event_id", eventId);
  if (error) {
    throw error;
  }
}

export async function archiveStaleEvents() {
  if (!hasSupabaseAdminConfig()) {
    return { deleted: 0 };
  }

  const client = createAdminSupabaseClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS_AFTER_END);
  const cutoffIso = cutoff.toISOString();

  const { data, error } = await client
    .from("events")
    .delete()
    .or(`end_at.lt.${cutoffIso},and(end_at.is.null,start_at.lt.${cutoffIso})`)
    .select("id");

  if (error) {
    throw error;
  }

  return { deleted: data?.length ?? 0 };
}

export async function ingestEvents(options: { withEmbeddings?: boolean } = {}) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Missing Supabase admin configuration.");
  }

  const client = createAdminSupabaseClient();
  const feedEvents = await fetchAllLocalistEvents();
  const normalized = [];

  for (const item of feedEvents) {
    normalized.push(await normalizeLocalistEvent(item));
  }

  if (normalized.length === 0) {
    return { imported: 0, archived: 0, embedded: 0 };
  }

  // Optionally generate embeddings for events whose content hash changed. Disabled by default
  // because OpenAI calls add ~500ms each and can blow past Vercel Hobby's 60s function limit.
  let embedded = 0;
  if (options.withEmbeddings) {
    const { generateEmbedding } = await import("@/lib/ai");
    const ids = normalized.map((event) => event.id);
    const existingHashes = new Map<string, string | null>();

    const { data: existing } = await client.from("events").select("id, embed_hash").in("id", ids);
    for (const row of existing ?? []) {
      existingHashes.set(row.id, row.embed_hash ?? null);
    }

    for (const eventRecord of normalized) {
      const textToEmbed = buildEmbeddingText(eventRecord);
      const hash = embeddingHash(textToEmbed);

      if (existingHashes.get(eventRecord.id) !== hash) {
        const embedding = await generateEmbedding(textToEmbed);
        if (embedding) {
          Object.assign(eventRecord, { embedding, embed_hash: hash });
          embedded += 1;
        }
      }
    }
  }

  // Strip columns that might not exist in older Supabase schemas (geocode_source, embedding,
  // embed_hash were added by later migrations). Retry without them if the first upsert fails.
  const fullPayload = normalized as Database["public"]["Tables"]["events"]["Insert"][];
  let { error } = await client.from("events").upsert(fullPayload, { onConflict: "id" });

  if (error && error.code === "PGRST204") {
    const trimmedPayload = normalized.map((row) => {
      const copy: Record<string, unknown> = { ...row };
      delete copy.geocode_source;
      delete copy.embedding;
      delete copy.embed_hash;
      return copy;
    });
    const retry = await client
      .from("events")
      .upsert(trimmedPayload as Database["public"]["Tables"]["events"]["Insert"][], { onConflict: "id" });
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  const archived = await archiveStaleEvents();
  return { imported: normalized.length, archived: archived.deleted, embedded };
}

export async function getSimilarEvents(eventId: string, count = 3): Promise<SemanticSearchResult[]> {
  if (!hasSupabaseConfig()) return [];

  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data: eventData } = await client.from("events").select("embedding").eq("id", eventId).single();

  const embedding = (eventData as EventsRow | null)?.embedding;
  if (!embedding) return [];

  const { data: similarEvents, error } = await rpcMatchEvents(client, {
    query_embedding: embedding as number[],
    match_threshold: 0.5,
    match_count: count,
    exclude_id: eventId
  });

  if (error) throw error;
  return similarEvents ?? [];
}

export async function getRecommendedForUser(userId: string, count = 6) {
  if (!hasSupabaseConfig() || !hasSavedEventsConfig()) {
    return [];
  }

  const client = createAdminSupabaseClient();
  const { data: savedRows, error } = await client
    .from("saved_events")
    .select("events(embedding)")
    .eq("user_id", userId)
    .limit(10);

  if (error) throw error;

  const embeddings = ((savedRows ?? []) as Array<{ events: { embedding: number[] | null } | null }>)
    .map((row) => row.events?.embedding)
    .filter((value): value is number[] => Array.isArray(value) && value.length > 0);

  if (embeddings.length === 0) {
    return [];
  }

  const dims = embeddings[0].length;
  const centroid = new Array(dims).fill(0);
  for (const embedding of embeddings) {
    embedding.forEach((value, index) => {
      centroid[index] += value;
    });
  }
  const queryEmbedding = centroid.map((value) => value / embeddings.length);

  const serverClient = await createServerSupabaseClient();
  if (!serverClient) return [];

  const savedIds = await getSavedEventIds(userId);
  const { data: matches, error: matchError } = await rpcMatchEvents(serverClient, {
    query_embedding: queryEmbedding,
    match_threshold: 0.45,
    match_count: count + savedIds.size,
    exclude_id: null
  });

  if (matchError) throw matchError;

  return ((matches ?? []) as SemanticSearchResult[]).filter((event) => !savedIds.has(event.id)).slice(0, count);
}
