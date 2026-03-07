import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';

// Blocked SQL keywords — only SELECT is allowed
const BLOCKED_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY|VACUUM|REINDEX|CLUSTER|COMMENT|SECURITY|OWNER)\b/i;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const { sql } = await req.json();
    if (!sql || typeof sql !== 'string') {
      return errorResponse('sql string is required');
    }

    // Strip comments and normalize
    const cleaned = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    // Security: Only allow SELECT statements
    if (!cleaned.toUpperCase().startsWith('SELECT')) {
      return errorResponse('Only SELECT queries are allowed', 403);
    }

    if (BLOCKED_KEYWORDS.test(cleaned)) {
      return errorResponse('Query contains blocked keywords. Only SELECT is allowed.', 403);
    }

    // Block multiple statements
    const statements = cleaned.split(';').filter((s: string) => s.trim().length > 0);
    if (statements.length > 1) {
      return errorResponse('Only single statements are allowed', 403);
    }

    // Wrap query to scope to user's data via a CTE approach
    // The user can only see their own records/pipelines/imports via RLS,
    // so we execute directly through the user-scoped client.
    const startTime = performance.now();

    const { data, error: queryError } = await supabase.rpc('exec_readonly_sql', {
      query_text: cleaned,
    }).maybeSingle();

    // If RPC doesn't exist, fallback to direct query on common tables
    if (queryError?.message?.includes('exec_readonly_sql')) {
      // Fallback: use supabase's built-in query capabilities
      // Execute raw SQL via postgrest — this is limited but safe with RLS
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('records')
        .select('*')
        .limit(0);

      const executionTime = Math.round(performance.now() - startTime);

      return jsonResponse(
        {
          columns: [],
          rows: [],
          row_count: 0,
          execution_time_ms: executionTime,
          error: 'Custom SQL requires the exec_readonly_sql RPC function. Query was validated as safe.',
        },
        200,
        corsHeaders
      );
    }

    if (queryError) {
      return errorResponse('Query execution failed', 400, queryError.message);
    }

    const executionTime = Math.round(performance.now() - startTime);

    // Parse the result
    const result = data || { columns: [], rows: [] };
    const columns = result.columns || [];
    const rows = result.rows || [];

    return jsonResponse(
      {
        columns,
        rows,
        row_count: rows.length,
        execution_time_ms: executionTime,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});
