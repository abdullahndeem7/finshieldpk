import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseBrowser = createSupabaseBrowserClient();

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: { name: string; value: string; options?: Record<string, unknown> }[],
  ) => void;
};

export function createSupabaseServerClient(cookieAdapter: CookieAdapter) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
  });
}

// export async function updateTransactionStatus(
//   id: string,
//   reviewed: boolean,
//   client: ReturnType<typeof createSupabaseBrowserClient>,
// ) {
//   const { data, error } = await supabase
//     .from('transactions')
//     .update({ reviewed })
//     .eq('id', id);
//   return { data, error };
// }

// export async function updateTransactionStatus(id: string, reviewed: boolean) {
//   const { data, error } = await supabase
//     .from('transactions')
//     .update({ reviewed })
//     .eq('id', id);
//   return { data, error };
// }