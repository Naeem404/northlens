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

    const pipelineContext = pipelines?.map((p: any) =>
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
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
