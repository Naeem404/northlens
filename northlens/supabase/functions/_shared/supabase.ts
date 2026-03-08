// @ts-nocheck — Deno Edge Function shared module (runs on Supabase, not Next.js)
// Supabase client helpers for Edge Functions
// Creates authenticated and admin clients for use in Deno Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Create a Supabase client using the requesting user's auth token
export function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization');

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    }
  );
}

// Create a Supabase admin client with service role key (bypasses RLS)
export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
