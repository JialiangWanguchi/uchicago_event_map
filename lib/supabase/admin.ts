import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseAdminConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminSupabaseClient() {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Missing Supabase admin configuration.");
  }

  return createClient<Database>(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
