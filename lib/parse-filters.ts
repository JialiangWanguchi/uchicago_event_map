import type { EventFilters } from "@/types/event";

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseEventFilters(params: Record<string, string | string[] | undefined>): EventFilters {
  return {
    page: Number(params.page ?? 1),
    q: typeof params.q === "string" ? params.q : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    happeningNow: params.happeningNow === "1",
    semantic: params.semantic === "1",
    nearLat: parseNumber(typeof params.nearLat === "string" ? params.nearLat : undefined),
    nearLng: parseNumber(typeof params.nearLng === "string" ? params.nearLng : undefined),
    maxDistanceKm: parseNumber(typeof params.maxDistanceKm === "string" ? params.maxDistanceKm : undefined)
  };
}
