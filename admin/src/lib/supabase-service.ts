import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Service-role client: BYPASSES RLS. Server-only (the "server-only" import breaks the build if a client component imports this).
 *  Only call it AFTER requireStaff() has authorised the request. */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
