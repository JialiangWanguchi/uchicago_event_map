import type { SupabaseClient } from "@supabase/supabase-js";
import type { SemanticSearchResult } from "@/types/event";

export type MatchEventsArgs = {
  query_embedding: number[];
  match_threshold: number;
  match_count: number;
  exclude_id?: string | null;
};

export async function rpcMatchEvents(client: SupabaseClient, args: MatchEventsArgs) {
  const result = await client.rpc("match_events", args as never);
  return {
    data: (result.data ?? null) as SemanticSearchResult[] | null,
    error: result.error
  };
}
