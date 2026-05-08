import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Lazily created – null when credentials are not configured */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_client) _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

/** Convenience alias for legacy imports – may be null */
export const supabase = {
  from: (...args: Parameters<SupabaseClient['from']>) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    return client.from(...args);
  },
} as unknown as SupabaseClient;
