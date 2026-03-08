import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { generateJSON } from '../_shared/ai-client.ts';
import { NLQ_SYSTEM_PROMPT } from '../_shared/prompts.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { question, pipeline_id } = await req.json();
    if (!question) return new Response('Missing question', { status: 400, headers: corsHeaders });

    // Get pipeline context
    let pipelineContext = 'No specific pipeline selected.';
    if (pipeline_id) {
      const { data: pipeline } = await supabase
        .from('pipelines')
        .select('name, schema, record_count')
        .eq('id', pipeline_id)
        .single();

      if (pipeline) {
        pipelineContext = `Pipeline: "${pipeline.name}" (${pipeline.record_count} records)\nSchema fields: ${JSON.stringify(pipeline.schema)}\nPipeline ID: ${pipeline_id}`;
      }
    }

    // Generate SQL from natural language
    const systemPrompt = NLQ_SYSTEM_PROMPT
      .replace('{pipeline_context}', pipelineContext)
      .replace('{user_id}', user.id);

    const result = await generateJSON<{ sql: string; explanation: string }>(
      `${systemPrompt}\n\nUser question: "${question}"`,
      { model: 'gemini-2.5-flash', temperature: 0.1 }
    );

    // Security check
    const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
    if (blocked.test(result.sql)) {
      return new Response(JSON.stringify({ error: 'Generated unsafe SQL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute the SQL
    const { data: queryResult, error: queryError } = await supabase.rpc(
      'execute_readonly_query',
      { query_text: result.sql }
    );

    if (queryError) {
      return new Response(JSON.stringify({
        error: queryError.message,
        sql: result.sql,
        explanation: result.explanation,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      answer: result.explanation,
      sql: result.sql,
      data: queryResult,
      row_count: queryResult?.length ?? 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
