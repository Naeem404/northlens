import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';
import { geminiGenerate, parseJsonFromLLM } from '../_shared/ai-client.ts';
import { SCHEMA_GEN_PROMPT } from '../_shared/prompts.ts';

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

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return errorResponse('prompt string is required');
    }

    const rawOutput = await geminiGenerate(prompt, {
      systemPrompt: SCHEMA_GEN_PROMPT,
      config: { temperature: 0.1, maxOutputTokens: 1024 },
    });

    let schema;
    try {
      schema = parseJsonFromLLM(rawOutput);
      if (!Array.isArray(schema)) {
        throw new Error('Schema must be an array');
      }
      // Validate each field
      schema = schema.map((f: any) => ({
        name: String(f.name || '').replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
        type: ['string', 'number', 'boolean', 'url', 'date'].includes(f.type) ? f.type : 'string',
        description: String(f.description || f.name || ''),
      }));
    } catch {
      // Fallback schema
      schema = [
        { name: 'name', type: 'string', description: 'Item name' },
        { name: 'price', type: 'number', description: 'Price in CAD' },
        { name: 'url', type: 'url', description: 'Source URL' },
      ];
    }

    return jsonResponse({ schema, raw_output: rawOutput }, 200, corsHeaders);
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});
