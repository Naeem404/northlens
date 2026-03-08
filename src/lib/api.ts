import { createClient } from '@/lib/supabase/client';

function getSupabase() { return createClient(); }

export async function invokeFunction<T>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke(name, {
    body: body ? JSON.stringify(body) : undefined,
  });
  if (error) throw error;
  return data as T;
}

export async function invokeFunctionStream(
  name: string,
  body: unknown,
  onChunk: (chunk: string) => void,
  onDone: () => void
) {
  const { data: { session } } = await getSupabase().auth.getSession();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      onDone();
      break;
    }
    onChunk(decoder.decode(value));
  }
}
