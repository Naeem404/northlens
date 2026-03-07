import { generateJSON, generateContent } from './ai-client.ts';
import { EXTRACTION_LIST_PROMPT, EXTRACTION_DETAIL_PROMPT } from './prompts.ts';

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'date';
  description: string;
}

interface ExtractionResult {
  records: Record<string, any>[];
  source_url: string;
  extracted_at: string;
}

// Clean HTML to readable text/markdown for LLM consumption
function cleanHtml(html: string): string {
  // Remove scripts, styles, comments
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');

  // Convert common HTML elements to text
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' | ')
    .replace(/<\/th>/gi, ' | ')
    .replace(/<h[1-6][^>]*>/gi, '\n## ')
    .replace(/<\/h[1-6]>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Clean up whitespace
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Truncate to ~30K chars to fit in context window
  if (text.length > 30000) {
    text = text.slice(0, 30000) + '\n\n[Content truncated...]';
  }

  return text;
}

// Fetch webpage content
async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NorthLens/1.0; +https://northlens.ca)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-CA,en;q=0.9,fr-CA;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

// Generate content hash for deduplication
export function generateHash(data: Record<string, any>): string {
  const sorted = Object.keys(data).sort().reduce((acc: any, key) => {
    acc[key] = data[key];
    return acc;
  }, {});
  // Simple hash using string encoding (not crypto for speed)
  const str = JSON.stringify(sorted);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Main extraction function
export async function extractFromUrl(
  url: string,
  schema: SchemaField[],
  mode: 'list' | 'detail' = 'list'
): Promise<ExtractionResult> {
  // 1. Fetch the page
  const html = await fetchPage(url);

  // 2. Clean HTML to text
  const cleanedText = cleanHtml(html);

  // 3. Build the prompt
  const schemaStr = JSON.stringify(schema, null, 2);
  const basePrompt = mode === 'list' ? EXTRACTION_LIST_PROMPT : EXTRACTION_DETAIL_PROMPT;
  const prompt = basePrompt
    .replace('{schema}', schemaStr)
    .replace('{source_url}', url);

  // 4. Send to Gemini for extraction
  const fullPrompt = `${prompt}\n\n---\n\nWebpage content:\n\n${cleanedText}`;

  const records = await generateJSON<Record<string, any>[]>(fullPrompt, {
    model: 'gemini-2.5-flash',
    temperature: 0.1, // Low temperature for extraction accuracy
    maxOutputTokens: 16384,
  });

  // 5. Post-process: ensure array, validate URLs, clean numbers
  const processedRecords = (Array.isArray(records) ? records : [records]).map(record => {
    const processed: Record<string, any> = {};
    for (const field of schema) {
      let value = record[field.name] ?? null;

      // Type coercion
      if (value !== null) {
        switch (field.type) {
          case 'number':
            value = typeof value === 'string'
              ? parseFloat(value.replace(/[^0-9.-]/g, ''))
              : Number(value);
            if (isNaN(value)) value = null;
            break;
          case 'boolean':
            value = Boolean(value);
            break;
          case 'url':
            if (typeof value === 'string' && !value.startsWith('http')) {
              try {
                value = new URL(value, url).href;
              } catch {
                value = null;
              }
            }
            break;
        }
      }

      processed[field.name] = value;
    }

    // Always include source_url
    if (!processed.source_url) {
      processed.source_url = url;
    }

    return processed;
  });

  return {
    records: processedRecords,
    source_url: url,
    extracted_at: new Date().toISOString(),
  };
}

// Schema generation from natural language
import { SCHEMA_GENERATION_PROMPT } from './prompts.ts';

export async function generateSchema(prompt: string): Promise<SchemaField[]> {
  const schema = await generateJSON<SchemaField[]>(
    `${SCHEMA_GENERATION_PROMPT}\n\nUser's request: "${prompt}"`,
    {
      model: 'gemini-2.5-flash',
      temperature: 0.3,
    }
  );

  // Ensure source_url field exists
  if (!schema.find(f => f.name === 'source_url')) {
    schema.push({
      name: 'source_url',
      type: 'url',
      description: 'URL of the source page',
    });
  }

  return schema;
}

// Detect changes between old and new data
export function detectChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): { changed: boolean; changedFields: string[]; summary: string } {
  const changedFields: string[] = [];
  const changes: string[] = [];

  for (const key of Object.keys(newData)) {
    if (key === 'source_url') continue;

    const oldVal = oldData[key];
    const newVal = newData[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changedFields.push(key);

      if (typeof newVal === 'number' && typeof oldVal === 'number') {
        const pctChange = ((newVal - oldVal) / oldVal * 100).toFixed(1);
        const direction = newVal > oldVal ? 'increased' : 'decreased';
        changes.push(`${key} ${direction} from ${oldVal} to ${newVal} (${pctChange}%)`);
      } else {
        changes.push(`${key} changed from "${oldVal}" to "${newVal}"`);
      }
    }
  }

  return {
    changed: changedFields.length > 0,
    changedFields,
    summary: changes.join('; ') || 'No changes detected',
  };
}
