import { NEAR_ME_DEFAULT_KM } from "@/lib/map-categories";
import type { EventFilters } from "@/types/event";

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseEventFilters(params: Record<string, string | string[] | undefined>): EventFilters {
  const nearLat = parseNumber(typeof params.nearLat === "string" ? params.nearLat : undefined);
  const nearLng = parseNumber(typeof params.nearLng === "string" ? params.nearLng : undefined);
  const maxDistanceKm =
    parseNumber(typeof params.maxDistanceKm === "string" ? params.maxDistanceKm : undefined) ??
    (nearLat != null && nearLng != null ? NEAR_ME_DEFAULT_KM : undefined);

  return {
    q: typeof params.q === "string" ? params.q : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    happeningNow: params.happeningNow === "1",
    semantic: params.semantic === "1",
    nearLat,
    nearLng,
    maxDistanceKm
  };
}
