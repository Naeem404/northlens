// @ts-nocheck — Deno Edge Function (runs on Supabase, not Next.js)
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { generateContent } from '../_shared/ai-client.ts';
import { COMPETITIVE_BRIEF_PROMPT } from '../_shared/prompts.ts';
import { buildCanadianContext, formatCanadianContext } from '../_shared/context-engine.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { pipeline_ids } = await req.json();

    // Get business profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get recent changes
    const { data: recentVersions } = await supabase
      .from('record_versions')
      .select('*, records!inner(pipeline_id, data)')
      .in('pipeline_id', pipeline_ids || [])
      .order('detected_at', { ascending: false })
      .limit(50);

    // Get record summaries
    const { data: records } = await supabase
      .from('records')
      .select('pipeline_id, data')
      .in('pipeline_id', pipeline_ids || [])
      .eq('is_latest', true)
      .limit(200);

    const canadianCtx = await buildCanadianContext();

    const businessContext = `Business: ${profile?.business_name}
Industry: ${profile?.industry}
Location: ${profile?.location}`;

    const dataSummary = `
Total tracked records: ${records?.length || 0}
Recent changes (last 7 days): ${recentVersions?.length || 0}
Changes: ${JSON.stringify(recentVersions?.slice(0, 20).map((v: any) => v.change_summary) || [])}
Sample records: ${JSON.stringify(records?.slice(0, 10).map((r: any) => r.data) || [])}`;

    const prompt = COMPETITIVE_BRIEF_PROMPT
      .replace('{business_context}', businessContext)
      .replace('{data_summary}', dataSummary)
      .replace('{canadian_context}', formatCanadianContext(canadianCtx));

    const brief = await generateContent(
      [{ role: 'user', parts: [{ text: prompt }] }],
      { model: 'gemini-2.5-pro', temperature: 0.6, maxOutputTokens: 4096 }
    );

    return new Response(JSON.stringify({ brief, generated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
