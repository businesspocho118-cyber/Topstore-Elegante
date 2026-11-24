import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Variables de entorno de Supabase no configuradas (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  return createBrowserClient(env.url, env.key);
}
