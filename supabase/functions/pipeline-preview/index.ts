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

    const { url, prompt } = await req.json();
    if (!url || !prompt) {
      return errorResponse('url and prompt are required');
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return errorResponse('Invalid URL provided');
    }

    // Generate schema from prompt
    const schema = await generateSchema(prompt);

    // Attempt extraction (Agent 3 provides real logic)
    let records: Record<string, any>[] = [];
    try {
      records = await previewExtract(url, prompt, schema);
    } catch {
      // Best-effort preview
    }

    return jsonResponse(
      {
        schema,
        records,
        source_url: url,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

async function generateSchema(prompt: string) {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
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

async function previewExtract(
  _url: string,
  _prompt: string,
  _schema: any[]
): Promise<Record<string, any>[]> {
  // Placeholder: Agent 3 provides actual extraction logic
  return [];
}
