import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';
import { geminiGenerate, parseJsonFromLLM } from '../_shared/ai-client.ts';
import { ANOMALY_PROMPT } from '../_shared/prompts.ts';

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

    const { pipeline_id } = await req.json();
    if (!pipeline_id) {
      return errorResponse('pipeline_id is required');
    }

    // Get pipeline info
    const { data: pipeline, error: pipelineErr } = await supabase
      .from('pipelines')
      .select('*')
      .eq('id', pipeline_id)
      .single();

    if (pipelineErr || !pipeline) {
      return errorResponse('Pipeline not found', 404);
    }

    // Get all latest records
    const { data: records, error: recordsErr } = await supabase
      .from('records')
      .select('id, data, version, first_seen_at, last_updated_at, created_at')
      .eq('pipeline_id', pipeline_id)
      .eq('is_latest', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (recordsErr) {
      return errorResponse('Failed to fetch records', 500, recordsErr.message);
    }

    if (!records || records.length === 0) {
      return jsonResponse({ anomalies: [], record_count: 0 }, 200, corsHeaders);
    }

    // Get recent changes
    const { data: versions } = await supabase
      .from('record_versions')
      .select('record_id, old_data, new_data, changed_fields, change_summary, detected_at')
      .eq('pipeline_id', pipeline_id)
      .order('detected_at', { ascending: false })
      .limit(30);

    // Also compute basic stats for numeric fields
    const schema = (pipeline.schema as any[]) || [];
    const numericFields = schema.filter((f: any) => f.type === 'number');
    const stats: Record<string, { avg: number; stddev: number; min: number; max: number }> = {};

    for (const field of numericFields) {
      const values = records
        .map((r: any) => {
          const v = r.data?.[field.name];
          return typeof v === 'number' ? v : parseFloat(v);
        })
        .filter((v: number) => !isNaN(v));

      if (values.length > 0) {
        const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        const variance = values.reduce((sum: number, v: number) => sum + (v - avg) ** 2, 0) / values.length;
        const stddev = Math.sqrt(variance);
        stats[field.name] = {
          avg: Math.round(avg * 100) / 100,
          stddev: Math.round(stddev * 100) / 100,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }

    // Build context for AI anomaly detection
    const context = `Pipeline: "${pipeline.name}"
Schema: ${schema.map((f: any) => `${f.name}(${f.type})`).join(', ')}
Record count: ${records.length}

Numeric field statistics:
${Object.entries(stats).map(([field, s]) => `- ${field}: avg=${s.avg}, stddev=${s.stddev}, min=${s.min}, max=${s.max}`).join('\n')}

Recent changes (${(versions || []).length}):
${(versions || []).map((v: any) => `- ${v.change_summary || JSON.stringify(v.changed_fields)} at ${v.detected_at}`).join('\n')}

All records:
${JSON.stringify(records.map((r: any) => ({ id: r.id, ...r.data, _version: r.version, _first_seen: r.first_seen_at })), null, 1)}`;

    const rawOutput = await geminiGenerate(context, {
      systemPrompt: ANOMALY_PROMPT,
      config: { temperature: 0.2, maxOutputTokens: 4096 },
    });

    let anomalies;
    try {
      anomalies = parseJsonFromLLM(rawOutput);
      if (!Array.isArray(anomalies)) anomalies = [anomalies];
    } catch {
      anomalies = [];
    }

    return jsonResponse(
      {
        anomalies,
        stats,
        record_count: records.length,
        pipeline_id,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});
