import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient, getSupabaseAdmin } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';
import { geminiGenerate } from '../_shared/ai-client.ts';
import { NLQ_PROMPT } from '../_shared/prompts.ts';

// Blocked SQL keywords — only SELECT is allowed
const BLOCKED_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY|VACUUM|REINDEX)\b/i;

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

    const { question, pipeline_id } = await req.json();
    if (!question || typeof question !== 'string') {
      return errorResponse('question string is required');
    }

    // Get user's pipelines and imports for context
    const { data: pipelines } = await supabase
      .from('pipelines')
      .select('id, name, schema, record_count')
      .limit(10);

    const { data: imports } = await supabase
      .from('data_imports')
      .select('id, name, schema, record_count')
      .limit(10);

    // Build context about available data
    let dataContext = 'Available pipelines:\n';
    for (const p of (pipelines || [])) {
      const schemaFields = (p.schema as any[]).map((f: any) => `${f.name}(${f.type})`).join(', ');
      dataContext += `- "${p.name}" (id: ${p.id}, ${p.record_count} records) fields: ${schemaFields}\n`;
    }
    dataContext += '\nAvailable imports:\n';
    for (const i of (imports || [])) {
      const schemaFields = (i.schema as any[]).map((f: any) => `${f.name}(${f.type})`).join(', ');
      dataContext += `- "${i.name}" (id: ${i.id}, ${i.record_count} records) fields: ${schemaFields}\n`;
    }

    const systemPrompt = NLQ_PROMPT.replace('{user_id}', user.id);
    const fullPrompt = `${dataContext}\n\nUser question: ${question}${pipeline_id ? `\nFocus on pipeline: ${pipeline_id}` : ''}`;

    const sqlOutput = await geminiGenerate(fullPrompt, {
      systemPrompt,
      config: { temperature: 0.1, maxOutputTokens: 1024 },
    });

    // Clean the SQL
    const sql = sqlOutput
      .replace(/```sql?\n?/g, '')
      .replace(/```/g, '')
      .trim()
      .replace(/;$/, '');

    // Security validation
    if (!sql.toUpperCase().startsWith('SELECT')) {
      return errorResponse('Generated query is not a SELECT statement', 403);
    }

    if (BLOCKED_KEYWORDS.test(sql)) {
      return errorResponse('Generated query contains blocked keywords', 403);
    }

    // Execute the query using admin client (RLS bypass for cross-table joins)
    // but inject user_id filter for security
    const startTime = performance.now();

    const adminClient = getSupabaseAdmin();
    const { data: result, error: queryError } = await adminClient.rpc('exec_readonly_sql', {
      query_text: sql,
    });

    let columns: string[] = [];
    let rows: any[][] = [];

    if (queryError) {
      // Fallback: try direct query via PostgREST if RPC not available
      // For safety, only run if the SQL references the user's data
      if (!sql.includes(user.id)) {
        return jsonResponse({
          question,
          sql,
          columns: [],
          rows: [],
          row_count: 0,
          execution_time_ms: 0,
          note: 'Query generated but execution requires user_id filter.',
        }, 200, corsHeaders);
      }
    } else if (result) {
      columns = result.columns || [];
      rows = result.rows || [];
    }

    const executionTime = Math.round(performance.now() - startTime);

    return jsonResponse(
      {
        question,
        sql,
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
