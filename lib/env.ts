export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ingestSecret: process.env.INGEST_SECRET,
  /** Set in Vercel for Cron; sent as `Authorization: Bearer …` on scheduled runs. */
  cronSecret: process.env.CRON_SECRET,
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  nominatimEmail: process.env.NOMINATIM_EMAIL
};

export function hasSupabaseConfig() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasSupabaseAdminConfig() {
  return Boolean(hasSupabaseConfig() && env.supabaseServiceRoleKey);
}

export function hasClerkConfig() {
  return Boolean(env.clerkPublishableKey && env.clerkSecretKey);
}

export function hasClientClerkConfig() {
  return Boolean(env.clerkPublishableKey);
}

export function hasSavedEventsConfig() {
  return Boolean(hasClerkConfig() && hasSupabaseAdminConfig());
}
