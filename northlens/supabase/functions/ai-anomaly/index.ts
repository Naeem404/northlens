// @ts-nocheck — Deno Edge Function (runs on Supabase, not Next.js)
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { generateJSON } from '../_shared/ai-client.ts';
import { ANOMALY_DETECTION_PROMPT } from '../_shared/prompts.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { pipeline_id, lookback_days = 7 } = await req.json();

    // Get recent changes
    const since = new Date();
    since.setDate(since.getDate() - lookback_days);

    const { data: recentVersions } = await supabase
      .from('record_versions')
      .select('*')
      .eq('pipeline_id', pipeline_id)
      .gte('detected_at', since.toISOString())
      .order('detected_at', { ascending: false });

    // Get historical data for context
    const { data: allVersions } = await supabase
      .from('record_versions')
      .select('changed_fields, new_data, old_data')
      .eq('pipeline_id', pipeline_id)
      .limit(200);

    const prompt = ANOMALY_DETECTION_PROMPT
      .replace('{changes_data}', JSON.stringify(recentVersions?.slice(0, 30) || []))
      .replace('{historical_context}', JSON.stringify(allVersions?.slice(0, 50) || []));

    const anomalies = await generateJSON<any[]>(prompt, {
      model: 'gemini-2.5-flash',
      temperature: 0.3,
    });

    return new Response(JSON.stringify({ anomalies, analyzed_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
