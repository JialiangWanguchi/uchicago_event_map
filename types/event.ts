export type GeocodeSource = "lookup" | "geocoder" | "upstream" | "fallback" | "none";

export type EventFilters = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  happeningNow?: boolean;
  semantic?: boolean;
  nearLat?: number;
  nearLng?: number;
  maxDistanceKm?: number;
};

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string | null;
  source_url: string;
  image_url: string | null;
  venue_name: string | null;
  address: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_source: GeocodeSource | null;
  categories: string[];
  tags: string[];
  source_updated_at: string | null;
  imported_at: string;
  distance_km?: number;
};

export type MapEventRecord = Pick<
  EventRecord,
  "id" | "slug" | "title" | "start_at" | "end_at" | "latitude" | "longitude" | "categories" | "location_text" | "venue_name" | "geocode_source"
>;

export type EventListResult = {
  events: EventRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type SemanticSearchResult = {
  id: string;
  slug: string;
  title: string;
  start_at: string;
  end_at: string | null;
  venue_name: string | null;
  location_text: string | null;
  categories: string[];
  similarity: number;
};
