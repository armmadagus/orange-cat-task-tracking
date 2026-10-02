import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

export function createAdminClient() {
  const adminKey = process.env.SUPABASE_SECRET_KEY;
  if (!adminKey) return null;

  const { url } = getSupabaseEnv();
  return createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
