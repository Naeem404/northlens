# AGENT 3: AI & Extraction Intelligence Engine
## NorthLens — Gemini + @lightfeed/extractor + AI Chat + Intelligence

---

## YOUR ROLE
You are building the **AI brain** of NorthLens. This includes all LLM-powered features: web data extraction via @lightfeed/extractor, schema generation from natural language, the AI chat advisor with function calling and streaming, natural language → SQL querying, competitive brief generation, anomaly detection, and the Canadian Context Engine.

**You own everything that involves LLMs, intelligence, and extraction logic.**

---

## PRODUCT CONTEXT (Read This First)

NorthLens is a web platform combining LightFeed-style web data pipelines with Triple Whale-style analytics for small Canadian businesses. The AI layer is what makes the product magical:

1. **User types a prompt** → you generate a structured schema for extraction
2. **Given a URL + schema** → you extract structured data from the webpage using LLMs
3. **User asks a question** → you convert it to SQL, execute it, and explain the results
4. **Data changes** → you detect anomalies and generate explanations
5. **Weekly** → you generate competitive intelligence briefs
6. **Always** → you maintain awareness of Canadian business context (CAD/USD, seasonality, regulations)

---

## PROJECT STRUCTURE

You own these files:

```
northlens/
├── supabase/
│   └── functions/
│       ├── ai-chat/
│       │   └── index.ts              ← YOU CREATE (streaming AI chat with function calling)
│       ├── ai-brief/
│       │   └── index.ts              ← YOU CREATE (competitive brief generator)
│       ├── ai-schema-gen/
│       │   └── index.ts              ← YOU CREATE (NL prompt → schema)
│       ├── ai-extract/
│       │   └── index.ts              ← YOU CREATE (URL + schema → structured data)
│       ├── ai-nlq/
│       │   └── index.ts              ← YOU CREATE (natural language → SQL → result)
│       ├── ai-anomaly/
│       │   └── index.ts              ← YOU CREATE (anomaly detection on records)
│       └── _shared/
│           ├── ai-client.ts          ← YOU CREATE (Gemini client wrapper)
│           ├── prompts.ts            ← YOU CREATE (all system prompts)
│           ├── tools.ts              ← YOU CREATE (function calling tool definitions)
│           ├── extractor.ts          ← YOU CREATE (@lightfeed/extractor wrapper)
│           ├── context-engine.ts     ← YOU CREATE (Canadian context builder)
│           ├── cors.ts               ← Agent 1 provides
│           ├── supabase.ts           ← Agent 1 provides
│           └── types.ts              ← Agent 1 provides
├── src/
│   └── lib/
│       └── ai/
│           ├── message-parser.ts     ← YOU CREATE (parse streaming AI responses for frontend)
│           └── tool-renderers.ts     ← YOU CREATE (render tool call results in chat)
```

---

## DELIVERABLE 1: GEMINI CLIENT WRAPPER

Create `supabase/functions/_shared/ai-client.ts`:

```typescript
// Wrapper around Google Gemini API for all AI operations in NorthLens.
// Uses Gemini 2.5 Flash for fast operations (extraction, schema gen)
// Uses Gemini 2.5 Pro for complex operations (chat, briefs, analysis)

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, any> };
  functionResponse?: { name: string; response: Record<string, any> };
}

interface GeminiTool {
  functionDeclarations: FunctionDeclaration[];
}

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface GeminiConfig {
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  tools?: GeminiTool[];
  responseMimeType?: string;
}

export async function generateContent(
  messages: GeminiMessage[],
  config: GeminiConfig = {}
): Promise<string> {
  const {
    model = 'gemini-2.5-flash',
    temperature = 0.7,
    maxOutputTokens = 8192,
    systemInstruction,
    tools,
    responseMimeType,
  } = config;

  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const body: any = {
    contents: messages,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (tools) {
    body.tools = tools;
  }

  if (responseMimeType) {
    body.generationConfig.responseMimeType = responseMimeType;
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function generateContentStream(
  messages: GeminiMessage[],
  config: GeminiConfig = {}
): Promise<ReadableStream> {
  const {
    model = 'gemini-2.5-pro',
    temperature = 0.7,
    maxOutputTokens = 8192,
    systemInstruction,
    tools,
  } = config;

  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const body: any = {
    contents: messages,
    generationConfig: { temperature, maxOutputTokens },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (tools) {
    body.tools = tools;
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini streaming error: ${response.status} ${err}`);
  }

  return response.body!;
}

// Convenience: generate JSON output
export async function generateJSON<T>(
  prompt: string,
  config: Omit<GeminiConfig, 'responseMimeType'> = {}
): Promise<T> {
  const result = await generateContent(
    [{ role: 'user', parts: [{ text: prompt }] }],
    { ...config, responseMimeType: 'application/json' }
  );

  try {
    return JSON.parse(result) as T;
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
    throw new Error(`Failed to parse Gemini JSON response: ${result.slice(0, 200)}`);
  }
}
```

---

## DELIVERABLE 2: ALL SYSTEM PROMPTS

Create `supabase/functions/_shared/prompts.ts`:

```typescript
// ============================================================
// NorthLens System Prompts
// ============================================================

export const SCHEMA_GENERATION_PROMPT = `You are a data schema generator for NorthLens, a competitive intelligence platform for Canadian businesses.

Given a user's natural language description of what data they want to extract from websites, generate a JSON schema.

Rules:
- Generate 4-10 fields that best capture the user's intent
- Always include a "source_url" field of type "url"
- For product/pricing data, always include "name" and "price" fields
- Use camelCase for field names
- Types must be one of: "string", "number", "boolean", "url", "date"
- Descriptions should be concise (under 15 words)
- Think about what fields would be most useful for competitive analysis

Return a JSON array of objects with: { "name": string, "type": string, "description": string }`;

export const EXTRACTION_LIST_PROMPT = `You are a data extraction engine for NorthLens. Extract structured data from the provided webpage content.

This is a LIST extraction — the page contains multiple items (products, listings, entries, etc.).

Schema to extract:
{schema}

Rules:
- Extract ALL matching items on the page. Do not skip any.
- For prices: extract as pure numbers (remove $, CAD, currency symbols). Use the numeric value only.
- For URLs: return absolute URLs. If you find relative URLs, resolve them against the base URL: {source_url}
- For ratings: normalize to a 0-5 scale if possible.
- If a field value is not found for an item, use null.
- Be thorough and precise. Accuracy is critical for competitive intelligence.
- Do NOT include navigation items, footer links, or sidebar content as data items.
- Focus only on the main content area.

Return a JSON array of objects matching the schema. Nothing else.`;

export const EXTRACTION_DETAIL_PROMPT = `You are a data extraction engine for NorthLens. Extract structured data from the provided webpage content.

This is a DETAIL extraction — the page contains a single item with detailed information.

Schema to extract:
{schema}

Rules:
- Extract comprehensive information about the single item on this page.
- For prices: extract as pure numbers (remove $, CAD, currency symbols).
- For URLs: return absolute URLs. Resolve relative URLs against: {source_url}
- If a field value is not found, use null.
- Look for information in product descriptions, specs tables, metadata, and structured data.
- Be thorough — capture nested details that might be missed.

Return a single JSON object matching the schema. Nothing else.`;

export const NLQ_SYSTEM_PROMPT = `You are NorthLens SQL, a natural language to SQL converter for a competitive intelligence platform.

The user's data is stored in PostgreSQL with this structure:

Table: public.records
- id (UUID)
- pipeline_id (UUID) — which extraction pipeline this record belongs to
- data (JSONB) — the actual extracted data, fields vary by pipeline schema
- source_url (TEXT)
- version (INTEGER)
- is_latest (BOOLEAN) — TRUE for the most current version
- first_seen_at (TIMESTAMPTZ)
- last_updated_at (TIMESTAMPTZ)

Table: public.record_versions
- record_id (UUID)
- pipeline_id (UUID)
- version (INTEGER)
- old_data (JSONB)
- new_data (JSONB)
- changed_fields (TEXT[])
- detected_at (TIMESTAMPTZ)

Table: public.import_records
- id (UUID)
- import_id (UUID)
- data (JSONB) — user's own business data
- created_at (TIMESTAMPTZ)

To access JSONB fields, use: data->>'field_name' for text, (data->>'field_name')::numeric for numbers.

User's pipeline info:
{pipeline_context}

Rules:
- Generate ONLY SELECT statements. Never INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE.
- Always filter by pipeline_id when querying records.
- Always filter is_latest = TRUE unless the user asks about historical data.
- Filter by user_id = '{user_id}' for security.
- Use proper JSONB operators for data access.
- Return clean, efficient SQL.
- Add appropriate aliases for readability.
- Include ORDER BY and LIMIT when appropriate.

Return JSON: { "sql": "SELECT ...", "explanation": "This query..." }`;

export const AI_ADVISOR_SYSTEM_PROMPT = `You are NorthLens AI, a competitive intelligence advisor for Canadian small businesses.

You help business owners understand their competitive landscape, make pricing decisions, identify market opportunities, and stay ahead of competitors.

{business_context}

{pipeline_context}

{canadian_context}

You have access to these tools:
- execute_sql: Run a SQL query against the user's data and return results
- search_records: Semantic search across pipeline data
- create_chart: Generate a chart visualization
- get_price_history: Get historical values for a specific record field
- compare_records: Side-by-side comparison of records

Guidelines:
- Always be specific. Reference actual data points, not generalities.
- When comparing prices, always use CAD.
- Consider Canadian seasonality (harsh winters, specific holidays).
- Factor in CAD/USD exchange rate for cross-border competition.
- Recommend ACTIONS, not just observations. Tell them what to DO.
- Keep responses concise but data-rich.
- When you need data to answer a question, use your tools. Don't guess.
- Format currency as CAD: $XXX.XX
- Use markdown formatting for readability.`;

export const COMPETITIVE_BRIEF_PROMPT = `You are NorthLens AI generating a weekly competitive intelligence brief for a Canadian small business.

{business_context}

{data_summary}

{canadian_context}

Generate a brief with these sections:

## Market Pulse
Summary of competitive landscape changes this week.

## Price Movements
Notable price changes from tracked competitors. Include specific numbers.

## Opportunities Detected
Market gaps, underserved segments, or timing advantages.

## Recommended Actions
3-5 specific, actionable steps the business should take this week.

## Risk Alerts
Any threats detected (competitor undercutting, new market entrants, regulatory changes).

Keep it concise, data-driven, and actionable. Use actual numbers from the data.`;

export const ANOMALY_DETECTION_PROMPT = `You are NorthLens AI analyzing competitive data for anomalies.

Given the following recent changes in extracted data:
{changes_data}

Historical context:
{historical_context}

Identify anomalies — data points that deviate significantly from normal patterns. For each anomaly:
1. What changed and by how much
2. Why this is unusual (compared to historical pattern)
3. Potential business impact
4. Recommended response

Return JSON array: [{ "record_id": string, "field": string, "description": string, "severity": "low"|"medium"|"high", "recommendation": string }]`;
```

---

## DELIVERABLE 3: EXTRACTION ENGINE

Create `supabase/functions/_shared/extractor.ts`:

This wraps the @lightfeed/extractor library. Since we're in Deno (Supabase Edge Functions), we'll use the core extraction logic directly with Gemini.

```typescript
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
```

---

## DELIVERABLE 4: CANADIAN CONTEXT ENGINE

Create `supabase/functions/_shared/context-engine.ts`:

```typescript
// Canadian Context Engine — provides business-relevant Canadian context to AI

interface CanadianContext {
  exchange_rate: { cad_usd: number; trend: string };
  season: string;
  upcoming_holidays: string[];
  weather?: { temp_c: number; condition: string; location: string };
}

const CANADIAN_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'New Year\'s Day' },
  { date: '2026-02-16', name: 'Family Day (ON)' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-18', name: 'Victoria Day' },
  { date: '2026-07-01', name: 'Canada Day' },
  { date: '2026-08-03', name: 'Civic Holiday (ON)' },
  { date: '2026-09-07', name: 'Labour Day' },
  { date: '2026-10-12', name: 'Thanksgiving' },
  { date: '2026-11-11', name: 'Remembrance Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-26', name: 'Boxing Day' },
];

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

function getUpcomingHolidays(count = 3): string[] {
  const now = new Date().toISOString().split('T')[0];
  return CANADIAN_HOLIDAYS_2026
    .filter(h => h.date >= now)
    .slice(0, count)
    .map(h => `${h.name} (${h.date})`);
}

async function getExchangeRate(): Promise<{ cad_usd: number; trend: string }> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/CAD');
    if (res.ok) {
      const data = await res.json();
      return { cad_usd: data.rates?.USD ?? 0.73, trend: 'stable' };
    }
  } catch {}
  return { cad_usd: 0.73, trend: 'unknown' };
}

async function getWeather(location = 'Waterloo'): Promise<{ temp_c: number; condition: string; location: string } | undefined> {
  try {
    // Open-Meteo — free, no API key needed
    // Waterloo, ON coords: 43.4643, -80.5204
    const lat = 43.4643;
    const lon = -80.5204;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    if (res.ok) {
      const data = await res.json();
      const weather = data.current_weather;
      let condition = 'Clear';
      if (weather.weathercode >= 51) condition = 'Rainy';
      if (weather.weathercode >= 71) condition = 'Snowy';
      if (weather.weathercode >= 80) condition = 'Stormy';
      if (weather.temperature < -10) condition = 'Extreme Cold';
      return { temp_c: weather.temperature, condition, location };
    }
  } catch {}
  return undefined;
}

export async function buildCanadianContext(): Promise<CanadianContext> {
  const [exchange_rate, weather] = await Promise.all([
    getExchangeRate(),
    getWeather(),
  ]);

  return {
    exchange_rate,
    season: getSeason(),
    upcoming_holidays: getUpcomingHolidays(),
    weather,
  };
}

export function formatCanadianContext(ctx: CanadianContext): string {
  let text = `Canadian Business Context:\n`;
  text += `- Season: ${ctx.season}\n`;
  text += `- CAD/USD Exchange Rate: ${ctx.exchange_rate.cad_usd.toFixed(4)} (${ctx.exchange_rate.trend})\n`;
  text += `- Upcoming Holidays: ${ctx.upcoming_holidays.join(', ')}\n`;
  if (ctx.weather) {
    text += `- Weather in ${ctx.weather.location}: ${ctx.weather.temp_c}°C, ${ctx.weather.condition}\n`;
  }
  return text;
}
```

---

## DELIVERABLE 5: FUNCTION CALLING TOOLS

Create `supabase/functions/_shared/tools.ts`:

```typescript
// Tool definitions for Gemini function calling in the AI chat advisor

export const AI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'execute_sql',
        description: 'Execute a read-only SQL query against the user\'s competitive intelligence data. Use this to answer data questions. Only SELECT statements are allowed.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'A SELECT SQL query. Use data->>\'field\' for JSONB access. Always filter by pipeline_id and user_id.',
            },
            explanation: {
              type: 'string',
              description: 'Brief explanation of what this query does.',
            },
          },
          required: ['query', 'explanation'],
        },
      },
      {
        name: 'search_records',
        description: 'Semantic search across pipeline data. Finds records similar to the search query by meaning.',
        parameters: {
          type: 'object',
          properties: {
            pipeline_id: { type: 'string', description: 'Pipeline to search in' },
            query: { type: 'string', description: 'Natural language search query' },
            limit: { type: 'number', description: 'Max results (default 10)' },
          },
          required: ['pipeline_id', 'query'],
        },
      },
      {
        name: 'create_chart',
        description: 'Generate a chart visualization to display in the chat. Returns chart config that the frontend renders.',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['line', 'bar', 'radar', 'pie'], description: 'Chart type' },
            title: { type: 'string', description: 'Chart title' },
            data: {
              type: 'array',
              description: 'Array of data points. Each item should have label and value(s).',
              items: { type: 'object' },
            },
            x_field: { type: 'string', description: 'Field name for X axis' },
            y_fields: {
              type: 'array',
              description: 'Field name(s) for Y axis',
              items: { type: 'string' },
            },
          },
          required: ['type', 'title', 'data', 'x_field', 'y_fields'],
        },
      },
      {
        name: 'get_price_history',
        description: 'Get historical values for a specific record and field, showing how it changed over time.',
        parameters: {
          type: 'object',
          properties: {
            record_id: { type: 'string', description: 'Record UUID' },
            field: { type: 'string', description: 'Field name to track' },
          },
          required: ['record_id', 'field'],
        },
      },
      {
        name: 'compare_records',
        description: 'Side-by-side comparison of multiple records on specified fields.',
        parameters: {
          type: 'object',
          properties: {
            record_ids: {
              type: 'array',
              description: 'Record UUIDs to compare',
              items: { type: 'string' },
            },
            fields: {
              type: 'array',
              description: 'Fields to compare',
              items: { type: 'string' },
            },
          },
          required: ['record_ids', 'fields'],
        },
      },
    ],
  },
];

// Execute a tool call and return the result
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabase: any,
  userId: string
): Promise<any> {
  switch (toolName) {
    case 'execute_sql': {
      // Security: only allow SELECT
      const sql = args.query.trim();
      if (!/^SELECT/i.test(sql)) {
        return { error: 'Only SELECT queries are allowed.' };
      }
      const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
      if (blocked.test(sql)) {
        return { error: 'Mutation queries are not allowed.' };
      }

      const { data, error } = await supabase.rpc('execute_readonly_query', {
        query_text: sql,
      });

      if (error) return { error: error.message };
      return { rows: data, explanation: args.explanation };
    }

    case 'search_records': {
      const { data, error } = await supabase
        .from('records')
        .select('id, data, source_url, last_updated_at')
        .eq('pipeline_id', args.pipeline_id)
        .eq('user_id', userId)
        .eq('is_latest', true)
        .limit(args.limit || 10);

      if (error) return { error: error.message };
      return { results: data };
    }

    case 'create_chart': {
      // Return the chart config for frontend rendering
      return {
        type: 'chart',
        chart_type: args.type,
        title: args.title,
        data: args.data,
        x_field: args.x_field,
        y_fields: args.y_fields,
      };
    }

    case 'get_price_history': {
      const { data, error } = await supabase
        .from('record_versions')
        .select('version, old_data, new_data, detected_at')
        .eq('record_id', args.record_id)
        .order('version', { ascending: true });

      if (error) return { error: error.message };

      const history = data.map((v: any) => ({
        version: v.version,
        value: v.new_data?.[args.field],
        previous: v.old_data?.[args.field],
        date: v.detected_at,
      }));

      return { field: args.field, history };
    }

    case 'compare_records': {
      const { data, error } = await supabase
        .from('records')
        .select('id, data')
        .in('id', args.record_ids)
        .eq('is_latest', true);

      if (error) return { error: error.message };

      const comparison = data.map((r: any) => {
        const row: Record<string, any> = { id: r.id };
        for (const field of args.fields) {
          row[field] = r.data[field];
        }
        return row;
      });

      return { comparison, fields: args.fields };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
```

---

## DELIVERABLE 6: EDGE FUNCTIONS

### `ai-schema-gen/index.ts` — Natural Language → Schema

```typescript
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { generateSchema } from '../_shared/extractor.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { prompt } = await req.json();
    if (!prompt) return new Response('Missing prompt', { status: 400, headers: corsHeaders });

    const schema = await generateSchema(prompt);

    return new Response(JSON.stringify({ schema }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### `ai-extract/index.ts` — URL + Schema → Structured Data

```typescript
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { extractFromUrl } from '../_shared/extractor.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { url, schema, mode } = await req.json();
    if (!url || !schema) {
      return new Response('Missing url or schema', { status: 400, headers: corsHeaders });
    }

    const result = await extractFromUrl(url, schema, mode || 'list');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### `ai-nlq/index.ts` — Natural Language → SQL → Results

```typescript
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { generateJSON } from '../_shared/ai-client.ts';
import { NLQ_SYSTEM_PROMPT } from '../_shared/prompts.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { question, pipeline_id } = await req.json();
    if (!question) return new Response('Missing question', { status: 400, headers: corsHeaders });

    // Get pipeline context
    let pipelineContext = 'No specific pipeline selected.';
    if (pipeline_id) {
      const { data: pipeline } = await supabase
        .from('pipelines')
        .select('name, schema, record_count')
        .eq('id', pipeline_id)
        .single();

      if (pipeline) {
        pipelineContext = `Pipeline: "${pipeline.name}" (${pipeline.record_count} records)\nSchema fields: ${JSON.stringify(pipeline.schema)}\nPipeline ID: ${pipeline_id}`;
      }
    }

    // Generate SQL from natural language
    const systemPrompt = NLQ_SYSTEM_PROMPT
      .replace('{pipeline_context}', pipelineContext)
      .replace('{user_id}', user.id);

    const result = await generateJSON<{ sql: string; explanation: string }>(
      `${systemPrompt}\n\nUser question: "${question}"`,
      { model: 'gemini-2.5-flash', temperature: 0.1 }
    );

    // Security check
    const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
    if (blocked.test(result.sql)) {
      return new Response(JSON.stringify({ error: 'Generated unsafe SQL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute the SQL
    const { data: queryResult, error: queryError } = await supabase.rpc(
      'execute_readonly_query',
      { query_text: result.sql }
    );

    if (queryError) {
      return new Response(JSON.stringify({
        error: queryError.message,
        sql: result.sql,
        explanation: result.explanation,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      answer: result.explanation,
      sql: result.sql,
      data: queryResult,
      row_count: queryResult?.length ?? 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### `ai-chat/index.ts` — Streaming AI Chat with Function Calling

This is the most complex function. It streams responses and handles tool calls.

```typescript
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient, getSupabaseAdmin } from '../_shared/supabase.ts';
import { generateContent } from '../_shared/ai-client.ts';
import { AI_ADVISOR_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { AI_TOOLS, executeTool } from '../_shared/tools.ts';
import { buildCanadianContext, formatCanadianContext } from '../_shared/context-engine.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const adminClient = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { message, chat_id } = await req.json();
    if (!message) return new Response('Missing message', { status: 400, headers: corsHeaders });

    // Build context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: pipelines } = await supabase
      .from('pipelines')
      .select('id, name, schema, record_count, last_run_at')
      .eq('user_id', user.id);

    const canadianCtx = await buildCanadianContext();

    const businessContext = `Business: ${profile?.business_name || 'Unknown'}
Type: ${profile?.business_type || 'Unknown'}
Industry: ${profile?.industry || 'Unknown'}
Location: ${profile?.location || 'Unknown'}`;

    const pipelineContext = pipelines?.map(p =>
      `- "${p.name}" (${p.record_count} records, schema: ${JSON.stringify(p.schema?.map((f: any) => f.name))})`
    ).join('\n') || 'No pipelines configured.';

    const systemPrompt = AI_ADVISOR_SYSTEM_PROMPT
      .replace('{business_context}', businessContext)
      .replace('{pipeline_context}', `Active Pipelines:\n${pipelineContext}`)
      .replace('{canadian_context}', formatCanadianContext(canadianCtx));

    // Load or create chat
    let chatMessages: any[] = [];
    let chatId = chat_id;

    if (chatId) {
      const { data: chat } = await supabase
        .from('ai_chats')
        .select('messages')
        .eq('id', chatId)
        .single();
      if (chat) chatMessages = chat.messages;
    } else {
      const { data: newChat } = await supabase
        .from('ai_chats')
        .insert({ user_id: user.id, title: message.slice(0, 50) })
        .select()
        .single();
      chatId = newChat?.id;
    }

    // Build Gemini messages from chat history
    const geminiMessages = chatMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Add new user message
    geminiMessages.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini with tools
    const response = await generateContent(geminiMessages, {
      model: 'gemini-2.5-pro',
      systemInstruction: systemPrompt,
      tools: AI_TOOLS,
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    // Check if response contains function calls
    // For MVP, we handle one round of tool calling
    // Parse response for function calls (simplified — full implementation would handle streaming)
    let finalResponse = response;

    // TODO: In a more complete implementation, parse the Gemini response for
    // functionCall parts, execute them via executeTool(), and send results
    // back to Gemini for a final response. For the hackathon MVP, we return
    // the text response directly and handle tool calls client-side.

    // Save messages to chat
    const updatedMessages = [
      ...chatMessages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: finalResponse, timestamp: new Date().toISOString() },
    ];

    await supabase
      .from('ai_chats')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return new Response(JSON.stringify({
      chat_id: chatId,
      response: finalResponse,
      messages: updatedMessages,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### `ai-brief/index.ts` — Competitive Intelligence Brief

```typescript
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
Changes: ${JSON.stringify(recentVersions?.slice(0, 20).map(v => v.change_summary) || [])}
Sample records: ${JSON.stringify(records?.slice(0, 10).map(r => r.data) || [])}`;

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### `ai-anomaly/index.ts` — Anomaly Detection

```typescript
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## DELIVERABLE 7: FRONTEND AI HELPERS

Create `src/lib/ai/message-parser.ts`:

```typescript
// Parse AI chat messages for rich content rendering

export interface ParsedMessagePart {
  type: 'text' | 'code' | 'chart' | 'table' | 'tool_call' | 'tool_result';
  content: string;
  language?: string; // for code blocks
  chartConfig?: any; // for chart type
  tableData?: any;   // for table type
  toolName?: string;  // for tool_call type
}

export function parseAiMessage(content: string): ParsedMessagePart[] {
  const parts: ParsedMessagePart[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const chartRegex = /\[CHART:(\{[\s\S]*?\})\]/g;
  const tableRegex = /\[TABLE:(\{[\s\S]*?\})\]/g;

  let lastIndex = 0;
  const allMatches: { index: number; length: number; part: ParsedMessagePart }[] = [];

  // Find code blocks
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      part: { type: 'code', content: match[2], language: match[1] || 'sql' },
    });
  }

  // Find chart blocks
  while ((match = chartRegex.exec(content)) !== null) {
    try {
      const chartConfig = JSON.parse(match[1]);
      allMatches.push({
        index: match.index,
        length: match[0].length,
        part: { type: 'chart', content: '', chartConfig },
      });
    } catch {}
  }

  // Sort by position
  allMatches.sort((a, b) => a.index - b.index);

  // Build parts array with text between special blocks
  for (const m of allMatches) {
    if (m.index > lastIndex) {
      const text = content.slice(lastIndex, m.index).trim();
      if (text) parts.push({ type: 'text', content: text });
    }
    parts.push(m.part);
    lastIndex = m.index + m.length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) parts.push({ type: 'text', content: text });
  }

  // If no special blocks found, return whole content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}
```

Create `src/lib/ai/tool-renderers.ts`:

```typescript
// Render tool call results as React-friendly data structures

export interface ChartRenderData {
  type: 'line' | 'bar' | 'radar' | 'pie';
  title: string;
  data: any[];
  xField: string;
  yFields: string[];
}

export interface TableRenderData {
  columns: string[];
  rows: any[][];
}

export function parseToolResult(toolName: string, result: any): {
  type: 'chart' | 'table' | 'text' | 'comparison';
  data: any;
} {
  switch (toolName) {
    case 'execute_sql':
      if (result.rows && result.rows.length > 0) {
        return {
          type: 'table',
          data: {
            columns: Object.keys(result.rows[0]),
            rows: result.rows,
            explanation: result.explanation,
          },
        };
      }
      return { type: 'text', data: result.explanation || 'Query returned no results.' };

    case 'create_chart':
      return {
        type: 'chart',
        data: {
          type: result.chart_type,
          title: result.title,
          data: result.data,
          xField: result.x_field,
          yFields: result.y_fields,
        },
      };

    case 'get_price_history':
      return {
        type: 'chart',
        data: {
          type: 'line',
          title: `${result.field} History`,
          data: result.history,
          xField: 'date',
          yFields: ['value'],
        },
      };

    case 'compare_records':
      return {
        type: 'comparison',
        data: {
          fields: result.fields,
          records: result.comparison,
        },
      };

    case 'search_records':
      return {
        type: 'table',
        data: {
          columns: result.results?.[0] ? Object.keys(result.results[0].data) : [],
          rows: result.results?.map((r: any) => r.data) || [],
        },
      };

    default:
      return { type: 'text', data: JSON.stringify(result) };
  }
}
```

---

## INTEGRATION POINTS

| What | Who provides | How you connect |
|---|---|---|
| Database schema + types | Agent 1 | Import types, use Supabase client |
| CORS + Supabase helpers | Agent 1 | Import from `_shared/cors.ts` and `_shared/supabase.ts` |
| Pipeline creation flow | Agent 1 calls your `ai-schema-gen` and `ai-extract` | You provide the endpoints |
| Pipeline run flow | Agent 1 calls your `ai-extract` during pipeline execution | You provide extraction logic |
| AI chat UI rendering | Agent 2 renders your streamed responses | You return structured messages |
| Tool call results | Agent 2 renders charts/tables from your tool results | You return standard format via `tool-renderers.ts` |
| Frontend message parsing | Agent 2 imports `message-parser.ts` and `tool-renderers.ts` | You provide the parsing logic |

---

## CRITICAL RULES

1. **Gemini 2.5 Flash** for fast operations (extraction, schema gen, NLQ). **Gemini 2.5 Pro** for complex operations (chat, briefs, analysis).
2. **Temperature 0.1** for extraction (accuracy). **Temperature 0.3** for schema gen. **Temperature 0.7** for chat.
3. **Always validate generated SQL** — block all mutation keywords.
4. **Always sanitize extracted JSON** — handle malformed LLM output gracefully.
5. **Truncate HTML to 30K chars** before sending to LLM (context window limits).
6. **All prices in CAD** — Canadian dollars by default.
7. **Include Canadian context** in all AI advisor interactions.
8. **Handle errors gracefully** — never crash an Edge Function. Return structured error JSON.
9. **Log extraction results** for debugging (console.log in Deno Edge Functions).
10. **Rate limit awareness** — Gemini free tier has limits. Cache where possible.

---

## BUILD ORDER (Priority)

1. `ai-client.ts` — Gemini wrapper (foundation for everything)
2. `prompts.ts` — All system prompts
3. `extractor.ts` — Extraction engine (core product value)
4. `ai-schema-gen/index.ts` — Schema generation (needed for pipeline creation)
5. `ai-extract/index.ts` — Data extraction (needed for pipeline run)
6. `ai-nlq/index.ts` — Natural language querying (high-impact demo feature)
7. `context-engine.ts` — Canadian context
8. `tools.ts` — Function calling definitions
9. `ai-chat/index.ts` — AI advisor chat (the "wow" feature)
10. `ai-brief/index.ts` — Competitive briefs
11. `ai-anomaly/index.ts` — Anomaly detection
12. `message-parser.ts` + `tool-renderers.ts` — Frontend helpers
