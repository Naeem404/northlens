import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';
import { geminiGenerate, parseJsonFromLLM } from '../_shared/ai-client.ts';
import { EXTRACT_PROMPT } from '../_shared/prompts.ts';

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

    const { url, prompt, schema, html } = await req.json();
    if (!prompt || !schema) {
      return errorResponse('prompt and schema are required');
    }

    // If html not provided, fetch the URL
    let content = html;
    if (!content && url) {
      try {
        const pageRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NorthLens/1.0; +https://northlens.ca)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });
        content = await pageRes.text();
      } catch (fetchErr) {
        return errorResponse('Failed to fetch URL', 502, String(fetchErr));
      }
    }

    if (!content) {
      return errorResponse('Either url or html content is required');
    }

    // Truncate content to avoid token limits (keep first ~30k chars)
    const maxChars = 30000;
    if (content.length > maxChars) {
      content = content.substring(0, maxChars) + '\n[... truncated]';
    }

    // Strip heavy HTML elements to reduce noise
    content = stripHtmlNoise(content);

    const schemaDesc = schema
      .map((f: any) => `- ${f.name} (${f.type}): ${f.description}`)
      .join('\n');

    const fullPrompt = `User extraction prompt: ${prompt}

Target schema:
${schemaDesc}

Web page content:
${content}`;

    const rawOutput = await geminiGenerate(fullPrompt, {
      systemPrompt: EXTRACT_PROMPT,
      config: { temperature: 0.1, maxOutputTokens: 8192 },
    });

    let records;
    try {
      records = parseJsonFromLLM(rawOutput);
      if (!Array.isArray(records)) {
        records = [records];
      }
    } catch {
      records = [];
    }

    return jsonResponse(
      { records, record_count: records.length, source_url: url || null },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

function stripHtmlNoise(html: string): string {
  return html
    // Remove script and style tags with content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Remove SVG
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove data attributes
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
    // Collapse whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();
}
