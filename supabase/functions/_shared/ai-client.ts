// Shared AI client utilities for NorthLens Edge Functions
// Supports Gemini (Google AI) for direct LLM calls and Backboard.io for persistent AI memory

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const BACKBOARD_BASE = 'https://app.backboard.io/api';

// ============================================================
// GEMINI (Google AI) — Direct LLM calls
// ============================================================

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export async function geminiGenerate(
  prompt: string,
  opts: {
    systemPrompt?: string;
    history?: GeminiMessage[];
    config?: GeminiConfig;
    model?: string;
  } = {}
): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const model = opts.model || 'gemini-2.0-flash';
  const contents: GeminiMessage[] = [];

  if (opts.history) {
    contents.push(...opts.history);
  }

  const userParts = opts.systemPrompt
    ? [{ text: `${opts.systemPrompt}\n\n${prompt}` }]
    : [{ text: prompt }];

  contents.push({ role: 'user', parts: userParts });

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: opts.config?.temperature ?? 0.3,
        maxOutputTokens: opts.config?.maxOutputTokens ?? 4096,
        topP: opts.config?.topP ?? 0.95,
        topK: opts.config?.topK ?? 40,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export function parseJsonFromLLM(text: string): any {
  // Strip markdown fences and parse JSON from LLM output
  const cleaned = text
    .replace(/```json?\n?/g, '')
    .replace(/```/g, '')
    .trim();

  // Try parsing the whole thing
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find JSON array or object in the text
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);

    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);

    throw new Error('Could not parse JSON from LLM output');
  }
}

// ============================================================
// BACKBOARD.IO — Persistent AI Memory & Context Enrichment
// ============================================================
// Backboard provides:
// - Persistent memory across conversations (remembers user prefs, business context)
// - Thread management (conversation state)
// - Automatic context retrieval from memory
// - Tool calling support
// - Model routing across 17,000+ LLMs

export interface BackboardAssistant {
  assistant_id: string;
  name: string;
}

export interface BackboardThread {
  thread_id: string;
}

export interface BackboardMessage {
  content: string;
  status: string;
  run_id?: string;
  tool_calls?: BackboardToolCall[];
  memory_operation_id?: string;
}

export interface BackboardToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
    parsed_arguments: Record<string, any>;
  };
}

export interface BackboardTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

function getBackboardHeaders(): Record<string, string> {
  const apiKey = Deno.env.get('BACKBOARD_API_KEY');
  if (!apiKey) throw new Error('BACKBOARD_API_KEY not set');
  return { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
}

export function isBackboardConfigured(): boolean {
  return !!Deno.env.get('BACKBOARD_API_KEY');
}

export async function createBackboardAssistant(
  name: string,
  systemPrompt: string,
  tools?: BackboardTool[]
): Promise<BackboardAssistant> {
  const body: any = { name, system_prompt: systemPrompt };
  if (tools) body.tools = tools;

  const res = await fetch(`${BACKBOARD_BASE}/assistants`, {
    method: 'POST',
    headers: getBackboardHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Backboard create assistant failed: ${res.status}`);
  return await res.json();
}

export async function createBackboardThread(assistantId: string): Promise<BackboardThread> {
  const res = await fetch(`${BACKBOARD_BASE}/assistants/${assistantId}/threads`, {
    method: 'POST',
    headers: getBackboardHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error(`Backboard create thread failed: ${res.status}`);
  return await res.json();
}

export async function sendBackboardMessage(
  threadId: string,
  content: string,
  opts: { memory?: 'Auto' | 'Off'; stream?: boolean } = {}
): Promise<BackboardMessage> {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('stream', String(opts.stream ?? false));
  if (opts.memory) formData.append('memory', opts.memory);

  const apiKey = Deno.env.get('BACKBOARD_API_KEY');
  const res = await fetch(`${BACKBOARD_BASE}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey! },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Backboard message failed: ${res.status} ${errText}`);
  }
  return await res.json();
}

export async function submitBackboardToolOutputs(
  threadId: string,
  runId: string,
  toolOutputs: { tool_call_id: string; output: string }[]
): Promise<BackboardMessage> {
  const res = await fetch(`${BACKBOARD_BASE}/threads/${threadId}/tool-outputs`, {
    method: 'POST',
    headers: getBackboardHeaders(),
    body: JSON.stringify({ run_id: runId, tool_outputs: toolOutputs }),
  });

  if (!res.ok) throw new Error(`Backboard tool output failed: ${res.status}`);
  return await res.json();
}
