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
