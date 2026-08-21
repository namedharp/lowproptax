import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

export function supabaseServerIsConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SECRET_KEY);
}

export function getSupabaseServerClient(): SupabaseClient {
  const url = supabaseUrl();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  serverClient ??= createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return serverClient;
}

function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}
