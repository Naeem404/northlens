import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient, getSupabaseAdmin } from '../_shared/supabase.ts';
import { AI_ADVISOR_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { AI_TOOLS, executeTool } from '../_shared/tools.ts';
import { buildCanadianContext, formatCanadianContext } from '../_shared/context-engine.ts';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const BACKBOARD_API_BASE = 'https://api.backboard.io/v1';

// ─── Backboard.io integration ───
async function backboardChat(
  assistantId: string,
  threadId: string | null,
  message: string,
  systemPrompt: string,
  tools: any[],
  apiKey: string
): Promise<{ response: string; threadId: string }> {
  const body: any = {
    assistant_id: assistantId,
    message,
    system_prompt: systemPrompt,
    memory: 'Auto',
  };
  if (threadId) body.thread_id = threadId;

  const res = await fetch(`${BACKBOARD_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Backboard error: ${res.status}`);
  const data = await res.json();
  return { response: data.response || data.message || '', threadId: data.thread_id || threadId || '' };
}

async function getOrCreateBackboardAssistant(
  userId: string,
  businessName: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${BACKBOARD_API_BASE}/assistants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: `NorthLens-${businessName || userId.slice(0, 8)}`,
      model: 'gemini-2.5-pro',
      description: `Competitive intelligence advisor for ${businessName || 'a Canadian business'}`,
    }),
  });
  if (!res.ok) throw new Error(`Backboard assistant creation failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

// ─── Direct Gemini with full tool-calling loop ───
async function geminiChatWithTools(
  messages: any[],
  systemPrompt: string,
  tools: any[],
  supabase: any,
  userId: string,
  apiKey: string
): Promise<string> {
  const body: any = {
    contents: messages,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools,
  };

  const res = await fetch(
    `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0]?.content;
  if (!candidate?.parts) return 'I was unable to generate a response. Please try again.';

  // Check for function calls in the response
  const functionCallPart = candidate.parts.find((p: any) => p.functionCall);

  if (functionCallPart) {
    const { name: toolName, args } = functionCallPart.functionCall;

    // Execute the tool
    const toolResult = await executeTool(toolName, args, supabase, userId);

    // Build function response and send back to Gemini for final answer
    const updatedMessages = [
      ...messages,
      { role: 'model', parts: candidate.parts },
      {
        role: 'user',
        parts: [{
          functionResponse: {
            name: toolName,
            response: { result: toolResult },
          },
        }],
      },
    ];

    const followupBody: any = {
      contents: updatedMessages,
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools,
    };

    const followupRes = await fetch(
      `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followupBody),
      }
    );

    if (followupRes.ok) {
      const followupData = await followupRes.json();
      const text = followupData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }

    // Fallback: return tool result as formatted text
    const textPart = candidate.parts.find((p: any) => p.text);
    const prefix = textPart?.text || '';
    return `${prefix}\n\n**Tool: ${toolName}**\n\`\`\`json\n${JSON.stringify(toolResult, null, 2)}\n\`\`\``;
  }

  // No function call — return text directly
  return candidate.parts.map((p: any) => p.text || '').join('');
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { message, chat_id } = await req.json();
    if (!message) return new Response('Missing message', { status: 400, headers: corsHeaders });

    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!googleApiKey) throw new Error('GOOGLE_AI_API_KEY not set');

    const backboardApiKey = Deno.env.get('BACKBOARD_API_KEY');

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

    const pipelineContext = pipelines?.map((p: any) =>
      `- "${p.name}" (${p.record_count} records, schema: ${JSON.stringify(p.schema?.map((f: any) => f.name))}, id: ${p.id})`
    ).join('\n') || 'No pipelines configured.';

    const systemPrompt = AI_ADVISOR_SYSTEM_PROMPT
      .replace('{business_context}', businessContext)
      .replace('{pipeline_context}', `Active Pipelines:\n${pipelineContext}`)
      .replace('{canadian_context}', formatCanadianContext(canadianCtx));

    // Load or create chat
    let chatMessages: any[] = [];
    let chatId = chat_id;
    let backboardAssistantId: string | null = null;
    let backboardThreadId: string | null = null;

    if (chatId) {
      const { data: chat } = await supabase
        .from('ai_chats')
        .select('messages, context')
        .eq('id', chatId)
        .single();
      if (chat) {
        chatMessages = chat.messages || [];
        backboardAssistantId = chat.context?.backboard_assistant_id || null;
        backboardThreadId = chat.context?.backboard_thread_id || null;
      }
    } else {
      const { data: newChat } = await supabase
        .from('ai_chats')
        .insert({ user_id: user.id, title: message.slice(0, 50), messages: [] })
        .select()
        .single();
      chatId = newChat?.id;
    }

    let finalResponse: string;

    // ── Try Backboard.io first (if API key is set) ──
    if (backboardApiKey) {
      try {
        if (!backboardAssistantId) {
          backboardAssistantId = await getOrCreateBackboardAssistant(
            user.id,
            profile?.business_name || '',
            backboardApiKey
          );
        }

        const bbResult = await backboardChat(
          backboardAssistantId,
          backboardThreadId,
          message,
          systemPrompt,
          AI_TOOLS,
          backboardApiKey
        );

        finalResponse = bbResult.response;
        backboardThreadId = bbResult.threadId;

        // Save Backboard context
        await supabase
          .from('ai_chats')
          .update({
            context: {
              backboard_assistant_id: backboardAssistantId,
              backboard_thread_id: backboardThreadId,
            },
          })
          .eq('id', chatId);
      } catch (bbError) {
        // Fallback to direct Gemini
        console.error('Backboard fallback:', (bbError as Error).message);
        const geminiMessages = chatMessages.map((m: any) => ({
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: m.content }],
        }));
        geminiMessages.push({ role: 'user', parts: [{ text: message }] });

        finalResponse = await geminiChatWithTools(
          geminiMessages, systemPrompt, AI_TOOLS, supabase, user.id, googleApiKey
        );
      }
    } else {
      // ── Direct Gemini with tool-calling ──
      const geminiMessages = chatMessages.map((m: any) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.content }],
      }));
      geminiMessages.push({ role: 'user', parts: [{ text: message }] });

      finalResponse = await geminiChatWithTools(
        geminiMessages, systemPrompt, AI_TOOLS, supabase, user.id, googleApiKey
      );
    }

    // Save messages
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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
