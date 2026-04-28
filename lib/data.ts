import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchLocalistEvents } from "@/lib/localist";
import { normalizeLocalistEvent } from "@/lib/event-normalizer";
import { hasSavedEventsConfig, hasSupabaseAdminConfig, hasSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";
import type { EventFilters, EventListResult, EventRecord } from "@/types/event";

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
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("events")
    .select("*", { count: "exact" })
    .gte("start_at", filters.dateFrom ?? new Date().toISOString().slice(0, 10))
    .order("start_at", { ascending: true })
    .range(from, to);

  if (filters.dateTo) {
    query = query.lte("start_at", `${filters.dateTo}T23:59:59`);
  }

  if (filters.q) {
    const escaped = filters.q.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%,venue_name.ilike.%${escaped}%`);
  }

  if (filters.category) {
    query = query.overlaps("categories", [filters.category]);
  }

  const { data, count, error } = await query;
  if (error) {
    throw error;
  }

  return {
    events: (data ?? []) as EventRecord[],
    total: count ?? 0,
    page,
    pageSize
  };
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
  const client = createAdminSupabaseClient() as any;

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

export async function ingestEvents({ pages = 3 }: { pages?: number } = {}) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Missing Supabase admin configuration.");
  }

  const client = createAdminSupabaseClient() as any;
  const normalized = [];

  for (let page = 1; page <= pages; page += 1) {
    const response = await fetchLocalistEvents(page);
    for (const wrapper of response.events) {
      normalized.push(await normalizeLocalistEvent(wrapper.event));
    }

    if (page >= response.page.total) {
      break;
    }
  }

  if (normalized.length === 0) {
    return { imported: 0 };
  }

  const { error } = await client
    .from("events")
    .upsert(normalized as Database["public"]["Tables"]["events"]["Insert"][], { onConflict: "id" });
  if (error) {
    throw error;
  }

  return { imported: normalized.length };
}
