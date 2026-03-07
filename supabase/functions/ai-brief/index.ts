import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';
import { geminiGenerate } from '../_shared/ai-client.ts';
import { BRIEF_PROMPT } from '../_shared/prompts.ts';

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

    const { period } = await req.json().catch(() => ({ period: 'weekly' }));
    const lookbackDays = period === 'daily' ? 1 : 7;

    // Gather all data needed for the brief
    const [profileRes, pipelinesRes, importsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('pipelines').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('data_imports').select('*').limit(5),
    ]);

    const profile = profileRes.data;
    const pipelines = pipelinesRes.data || [];
    const imports = importsRes.data || [];

    if (pipelines.length === 0) {
      return jsonResponse({
        brief: '# No Data Available\n\nYou have no active pipelines yet. Create a pipeline to start tracking competitor data, then come back for your competitive brief.',
        generated_at: new Date().toISOString(),
      }, 200, corsHeaders);
    }

    // Get all records from all pipelines
    const pipelineIds = pipelines.map((p: any) => p.id);

    const [recordsRes, versionsRes, alertEventsRes, importRecordsRes] = await Promise.all([
      supabase
        .from('records')
        .select('data, pipeline_id, source_url, created_at')
        .in('pipeline_id', pipelineIds)
        .eq('is_latest', true)
        .limit(100),
      supabase
        .from('record_versions')
        .select('old_data, new_data, changed_fields, change_summary, detected_at, pipeline_id')
        .in('pipeline_id', pipelineIds)
        .gte('detected_at', new Date(Date.now() - lookbackDays * 86400000).toISOString())
        .order('detected_at', { ascending: false })
        .limit(30),
      supabase
        .from('alert_events')
        .select('summary, data, triggered_at')
        .eq('is_read', false)
        .order('triggered_at', { ascending: false })
        .limit(10),
      imports.length > 0
        ? supabase
            .from('import_records')
            .select('data')
            .eq('import_id', imports[0].id)
            .limit(30)
        : Promise.resolve({ data: [] }),
    ]);

    const records = recordsRes.data || [];
    const versions = versionsRes.data || [];
    const alertEvents = alertEventsRes.data || [];
    const importRecords = importRecordsRes.data || [];

    // Build comprehensive data context
    let context = `# Business Profile\n`;
    if (profile) {
      context += `Business: ${profile.business_name}\n`;
      context += `Industry: ${profile.industry}\n`;
      context += `Location: ${profile.location}, ${profile.province}\n`;
      const bp = profile.business_profile || {};
      if (bp.competitors) context += `Key competitors: ${bp.competitors.join(', ')}\n`;
      if (bp.product_categories) context += `Product categories: ${bp.product_categories.join(', ')}\n`;
      if (bp.price_range) context += `Price range: $${bp.price_range.min} - $${bp.price_range.max} CAD\n`;
    }

    context += `\n# Tracked Pipelines\n`;
    for (const p of pipelines) {
      context += `- "${p.name}" (${p.record_count} records, status: ${p.status})\n`;
    }

    context += `\n# Current Competitor Data (${records.length} records)\n`;
    context += JSON.stringify(records.map((r: any) => r.data).slice(0, 50), null, 1);

    if (versions.length > 0) {
      context += `\n\n# Recent Changes (last ${lookbackDays} days: ${versions.length} changes)\n`;
      for (const v of versions) {
        context += `- ${v.change_summary || 'Change detected'} (${v.detected_at})\n`;
        if (v.old_data && v.new_data) {
          const oldPrice = v.old_data.price;
          const newPrice = v.new_data.price;
          if (oldPrice && newPrice && oldPrice !== newPrice) {
            const pctChange = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
            context += `  Price: $${oldPrice} → $${newPrice} (${pctChange}%)\n`;
          }
        }
      }
    }

    if (alertEvents.length > 0) {
      context += `\n\n# Unread Alerts (${alertEvents.length})\n`;
      for (const e of alertEvents) {
        context += `- ${e.summary}\n`;
      }
    }

    if (importRecords.length > 0) {
      context += `\n\n# Your Products (${importRecords.length} from "${imports[0]?.name}")\n`;
      context += JSON.stringify(importRecords.map((r: any) => r.data).slice(0, 20), null, 1);
    }

    const prompt = `Generate a ${period || 'weekly'} competitive intelligence brief based on this data:\n\n${context}`;

    const brief = await geminiGenerate(prompt, {
      systemPrompt: BRIEF_PROMPT,
      config: { temperature: 0.4, maxOutputTokens: 4096 },
    });

    return jsonResponse(
      {
        brief,
        period: period || 'weekly',
        data_summary: {
          pipelines_analyzed: pipelines.length,
          records_analyzed: records.length,
          changes_detected: versions.length,
          unread_alerts: alertEvents.length,
        },
        generated_at: new Date().toISOString(),
      },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});
