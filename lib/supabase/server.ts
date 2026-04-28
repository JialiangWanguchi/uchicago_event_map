import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createServerSupabaseClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const cookieStore = await cookies();

  return createClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        "X-Client-Info": "campus-event-map/server",
        Cookie: cookieStore.toString()
      }
    }
  });
}
