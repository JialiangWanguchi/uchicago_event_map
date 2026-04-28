export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
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
          raw_payload: Json;
          source_updated_at: string | null;
          imported_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          summary?: string | null;
          description?: string | null;
          start_at: string;
          end_at?: string | null;
          timezone?: string | null;
          source_url: string;
          image_url?: string | null;
          venue_name?: string | null;
          address?: string | null;
          location_text?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          categories?: string[];
          tags?: string[];
          raw_payload?: Json;
          source_updated_at?: string | null;
          imported_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      saved_events: {
        Row: {
          user_id: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          event_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  };
};
