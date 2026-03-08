import { createClient } from '@/lib/supabase/client';

function getSupabase() { return createClient(); }

export async function invokeFunction<T>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke(name, {
    body: body ? JSON.stringify(body) : undefined,
  });
  if (error) throw error;
  return data as T;
}
