import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Session-aware client acting as the signed-in staff member (anon key, subject to RLS). Used only to identify the caller. */
export async function createSessionClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        try { toSet.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* middleware refreshes the session */ }
      },
    },
  });
}
