import { createClient } from '@/lib/supabase/client';

function getSupabase() { return createClient(); }

export async function invokeFunction<T>(name: string, body?: unknown): Promise<T> {
  const supabase = getSupabase();

  // Explicitly get session token to ensure auth header is sent
  const { data: { session } } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke(name, {
    body: body ?? undefined,
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
  });
  if (error) throw error;
  return data as T;
}
