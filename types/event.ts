export type EventFilters = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
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
  categories: string[];
  tags: string[];
  source_updated_at: string | null;
  imported_at: string;
};

export type EventListResult = {
  events: EventRecord[];
  total: number;
  page: number;
  pageSize: number;
};
