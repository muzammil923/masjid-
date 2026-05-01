import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getConfig() {
  const url = process.env.SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url, anonKey, serviceKey };
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const { url, anonKey } = getConfig();
    if (!url || !anonKey) {
      throw new Error(`Missing Supabase config: url=${!!url}, key=${!!anonKey}`);
    }
    _supabase = createClient(url, anonKey);
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const { url, serviceKey } = getConfig();
    if (!url || !serviceKey) {
      throw new Error(`Missing Supabase admin config: url=${!!url}, key=${!!serviceKey}`);
    }
    _supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}
