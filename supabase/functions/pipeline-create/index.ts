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

    const body = await req.json();
    const { prompt, sources, schedule, name } = body;

    if (!prompt || !sources || !Array.isArray(sources) || sources.length === 0) {
      return errorResponse('prompt and sources[] are required');
    }

    // Generate schema from prompt using Gemini
    const schema = await generateSchemaFromPrompt(prompt);

    // Build pipeline name from prompt if not provided
    const pipelineName = name || prompt.slice(0, 60) + (prompt.length > 60 ? '...' : '');

    // Format sources
    const formattedSources = sources.map((s: any) => ({
      url: s.url,
      label: s.label || new URL(s.url).hostname,
      enabled: true,
    }));

    // Insert pipeline
    const { data: pipeline, error: insertError } = await supabase
      .from('pipelines')
      .insert({
        user_id: user.id,
        name: pipelineName,
        description: '',
        prompt,
        schema,
        sources: formattedSources,
        extraction_mode: 'list',
        schedule: schedule || 'daily',
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      return errorResponse('Failed to create pipeline', 500, insertError.message);
    }

    // Try a preview extraction from the first source
    let previewRecords: Record<string, any>[] = [];
    try {
      previewRecords = await extractPreview(sources[0].url, prompt, schema);
    } catch {
      // Preview is best-effort, don't fail the whole request
    }

    return jsonResponse(
      { pipeline, preview_records: previewRecords },
      201,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

async function generateSchemaFromPrompt(prompt: string) {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    // Fallback schema if no API key
    return [
      { name: 'name', type: 'string', description: 'Item name' },
      { name: 'price', type: 'number', description: 'Price in CAD' },
      { name: 'url', type: 'url', description: 'Source URL' },
    ];
  }

  const systemPrompt = `You are a schema generator. Given a user's description of data they want to extract from websites, output a JSON array of schema fields. Each field has: name (snake_case), type (string|number|boolean|url|date), description. Output ONLY valid JSON array, no markdown.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser prompt: ${prompt}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    // Strip markdown fences if present
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      { name: 'name', type: 'string', description: 'Item name' },
      { name: 'price', type: 'number', description: 'Price in CAD' },
      { name: 'url', type: 'url', description: 'Source URL' },
    ];
  }
}

async function extractPreview(
  url: string,
  prompt: string,
  schema: any[]
): Promise<Record<string, any>[]> {
  // Placeholder: Agent 3 will provide the real extraction logic.
  // For now, return empty array. pipeline-run will handle actual extraction.
  return [];
}
