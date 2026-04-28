"use client";

import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserSupabaseClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!client) {
    client = createClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: {
        persistSession: false
      }
    });
  }

  return client;
}
