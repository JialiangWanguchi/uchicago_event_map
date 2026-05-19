import { ARCHIVE_DAYS_AFTER_END, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildEmbeddingText, embeddingHash } from "@/lib/embed-text";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyEventFilters(query: any, filters: EventFilters) {
  let q = query.gte("start_at", filters.dateFrom ?? new Date().toISOString().slice(0, 10));

  if (filters.dateTo) {
    q = q.lte("start_at", `${filters.dateTo}T23:59:59`);
  }

  if (filters.q && !filters.semantic) {
    const escaped = filters.q.replace(/[%_]/g, "");
    q = q.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%,venue_name.ilike.%${escaped}%`);
  }

  if (filters.category) {
    q = q.overlaps("categories", [filters.category]);
  }

  if (filters.happeningNow) {
    const now = new Date().toISOString();
    q = q.lte("start_at", now).or(`end_at.is.null,end_at.gte.${now}`);
  }

  return q;
}

function isLive(event: Pick<EventRecord, "start_at" | "end_at">, now = Date.now()) {
  const startMs = new Date(event.start_at).getTime();
  const endMs = event.end_at ? new Date(event.end_at).getTime() : startMs + 3600000;
  return now >= startMs && now <= endMs;
}

function sortEventsWithLiveFirst(events: EventRecord[]) {
  const now = Date.now();
  return [...events].sort((a, b) => {
    const aLive = isLive(a, now);
    const bLive = isLive(b, now);
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
  });
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

export async function getEvents(filters: EventFilters = {}): Promise<EventListResult> {
  if (!hasSupabaseConfig()) {
    return {
      events: [],
      total: 0,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE
    };
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return { events: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };
  }

  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  if (filters.semantic && filters.q) {
    const semantic = await searchEventsSemantic(filters.q, 50);
    const ids = semantic.map((row) => row.id);
    if (ids.length === 0) {
      return { events: [], total: 0, page, pageSize };
    }

    const { data, error } = await client.from("events").select("*").in("id", ids);
    if (error) throw error;

    const rows = (data ?? []) as EventRecord[];
    const byId = new Map(rows.map((row) => [row.id, row]));
    let ordered = ids.map((id) => byId.get(id)).filter(Boolean) as EventRecord[];
    ordered = applyNearMeFilters(ordered, filters);
    const total = ordered.length;
    const from = (page - 1) * pageSize;
    return {
      events: sortEventsWithLiveFirst(ordered.slice(from, from + pageSize)),
      total,
      page,
      pageSize
    };
  }

  if (filters.nearLat != null && filters.nearLng != null) {
    let query = client.from("events").select("*");
    query = applyEventFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;

    let events = (data ?? []) as EventRecord[];
    events = applyNearMeFilters(events, filters);
    const total = events.length;
    const from = (page - 1) * pageSize;
    return {
      events: sortEventsWithLiveFirst(events.slice(from, from + pageSize)),
      total,
      page,
      pageSize
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client.from("events").select("*", { count: "exact" }).order("start_at", { ascending: true });
  query = applyEventFilters(query, filters);

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    events: sortEventsWithLiveFirst((data ?? []) as EventRecord[]),
    total: count ?? 0,
    page,
    pageSize
  };
}

function applyNearMeFilters(events: EventRecord[], filters: EventFilters) {
  let result = attachDistance(events, filters.nearLat, filters.nearLng);

  if (filters.nearLat != null && filters.nearLng != null && filters.maxDistanceKm) {
    result = filterByMaxDistance(result, filters.nearLat, filters.nearLng, filters.maxDistanceKm);
  }

  if (filters.nearLat != null && filters.nearLng != null) {
    result = sortByDistance(result, filters.nearLat, filters.nearLng);
  }

  return result;
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
    .select("id, slug, title, start_at, end_at, latitude, longitude, categories, location_text, venue_name, geocode_source")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("start_at", { ascending: true })
    .limit(500);

  query = applyEventFilters(query, filters);

  const { data, error } = await query;
  if (error) throw error;

  let events = (data ?? []) as MapEventRecord[];

  if (filters.semantic && filters.q) {
    const semantic = await searchEventsSemantic(filters.q, 200);
    const allowed = new Set(semantic.map((row) => row.id));
    events = events.filter((event) => allowed.has(event.id));
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
    throw error;
  }

  return (data ?? []) as SemanticSearchResult[];
}

export async function getSavedEventIds(userId: string | null) {
  if (!userId || !hasSavedEventsConfig()) {
    return new Set<string>();
  }

  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("saved_events").select("event_id").eq("user_id", userId);
  if (error) {
    throw error;
  }

  return new Set(((data ?? []) as Database["public"]["Tables"]["saved_events"]["Row"][]).map((row) => row.event_id));
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

export async function ingestEvents() {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Missing Supabase admin configuration.");
  }

  const { generateEmbedding } = await import("@/lib/ai");
  const client = createAdminSupabaseClient();
  const feedEvents = await fetchAllLocalistEvents();
  const normalized = [];

  for (const item of feedEvents) {
    normalized.push(await normalizeLocalistEvent(item));
  }

  const existingHashes = new Map<string, string | null>();
  const ids = normalized.map((event) => event.id);

  if (ids.length > 0) {
    const { data: existing } = await client.from("events").select("id, embed_hash").in("id", ids);
    for (const row of existing ?? []) {
      existingHashes.set(row.id, row.embed_hash ?? null);
    }
  }

  for (const eventRecord of normalized) {
    const textToEmbed = buildEmbeddingText(eventRecord);
    const hash = embeddingHash(textToEmbed);

    if (existingHashes.get(eventRecord.id) !== hash) {
      const embedding = await generateEmbedding(textToEmbed);
      if (embedding) {
        Object.assign(eventRecord, { embedding, embed_hash: hash });
      }
    }
  }

  if (normalized.length === 0) {
    return { imported: 0, archived: 0 };
  }

  const { error } = await client
    .from("events")
    .upsert(normalized as Database["public"]["Tables"]["events"]["Insert"][], { onConflict: "id" });
  if (error) {
    throw error;
  }

  const archived = await archiveStaleEvents();
  return { imported: normalized.length, archived: archived.deleted };
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
