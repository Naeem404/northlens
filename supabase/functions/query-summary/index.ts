import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';

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

    // Verify user owns pipeline
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
      .select('*')
      .eq('pipeline_id', pipeline_id)
      .eq('is_latest', true);

    if (recordsErr) {
      return errorResponse('Failed to fetch records', 500, recordsErr.message);
    }

    const allRecords = records || [];

    // Get recent changes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentVersions, error: versionsErr } = await supabase
      .from('record_versions')
      .select('*')
      .eq('pipeline_id', pipeline_id)
      .gte('detected_at', sevenDaysAgo.toISOString())
      .order('detected_at', { ascending: false })
      .limit(20);

    if (versionsErr) {
      return errorResponse('Failed to fetch versions', 500, versionsErr.message);
    }

    // Compute metrics on numeric fields from schema
    const schema = (pipeline.schema as any[]) || [];
    const numericFields = schema.filter((f: any) => f.type === 'number');

    const metrics = numericFields.map((field: any) => {
      const values = allRecords
        .map((r: any) => {
          const val = r.data?.[field.name];
          return typeof val === 'number' ? val : parseFloat(val);
        })
        .filter((v: number) => !isNaN(v));

      if (values.length === 0) {
        return {
          field: field.name,
          avg: null,
          min: null,
          max: null,
          trend: null,
        };
      }

      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      // Compute trend: compare first half avg to second half avg
      let trend: number | null = null;
      if (values.length >= 4) {
        const mid = Math.floor(values.length / 2);
        const firstHalf = values.slice(0, mid);
        const secondHalf = values.slice(mid);
        const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
        if (firstAvg !== 0) {
          trend = Math.round(((secondAvg - firstAvg) / firstAvg) * 10000) / 100;
        }
      }

      return {
        field: field.name,
        avg: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        trend,
      };
    });

    return jsonResponse(
      {
        pipeline_id,
        total_records: allRecords.length,
        recent_changes: recentVersions || [],
        metrics,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});
