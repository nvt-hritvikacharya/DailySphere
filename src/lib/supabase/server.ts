import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, supabaseEnabled } from "../env";

export async function getSupabase() {
  if (!supabaseEnabled) return null;
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) store.set(name, value, options);
      },
    },
  });
}
