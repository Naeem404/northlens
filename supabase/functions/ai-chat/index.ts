import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';
import {
  geminiGenerate,
  isBackboardConfigured,
  createBackboardAssistant,
  createBackboardThread,
  sendBackboardMessage,
  submitBackboardToolOutputs,
} from '../_shared/ai-client.ts';
import { CHAT_SYSTEM_PROMPT } from '../_shared/prompts.ts';

// Backboard assistant/thread cache (per-user, stored in ai_chats.context)
// This enables persistent memory across conversations via Backboard.io

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

    const { message, chat_id } = await req.json();
    if (!message || typeof message !== 'string') {
      return errorResponse('message string is required');
    }

    // Load or create chat
    let chat: any = null;
    if (chat_id) {
      const { data } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('id', chat_id)
        .single();
      chat = data;
    }

    if (!chat) {
      const { data: newChat, error: createErr } = await supabase
        .from('ai_chats')
        .insert({
          user_id: user.id,
          title: message.slice(0, 60) + (message.length > 60 ? '...' : ''),
          messages: [],
          context: {},
        })
        .select()
        .single();

      if (createErr) return errorResponse('Failed to create chat', 500, createErr.message);
      chat = newChat;
    }

    // Load user profile and data context for enrichment
    const [profileRes, pipelinesRes, importsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('pipelines').select('id, name, schema, record_count, last_run_at').limit(10),
      supabase.from('data_imports').select('id, name, schema, record_count').limit(10),
    ]);

    const profile = profileRes.data;
    const pipelines = pipelinesRes.data || [];
    const imports = importsRes.data || [];

    // Build rich context for the AI
    let dataContext = '';
    if (profile) {
      dataContext += `Business: ${profile.business_name} (${profile.industry}), located in ${profile.location}\n`;
      const bp = profile.business_profile || {};
      if (bp.competitors) dataContext += `Competitors: ${bp.competitors.join(', ')}\n`;
      if (bp.product_categories) dataContext += `Categories: ${bp.product_categories.join(', ')}\n`;
    }

    dataContext += `\nPipelines (${pipelines.length}):\n`;
    for (const p of pipelines) {
      const fields = (p.schema as any[]).map((f: any) => f.name).join(', ');
      dataContext += `- "${p.name}" (${p.record_count} records, fields: ${fields})\n`;
    }

    dataContext += `\nImports (${imports.length}):\n`;
    for (const i of imports) {
      const fields = (i.schema as any[]).map((f: any) => f.name).join(', ');
      dataContext += `- "${i.name}" (${i.record_count} records, fields: ${fields})\n`;
    }

    // Fetch sample records for the main pipeline to give AI real data
    let sampleData = '';
    if (pipelines.length > 0) {
      const mainPipeline = pipelines[0];
      const { data: sampleRecords } = await supabase
        .from('records')
        .select('data')
        .eq('pipeline_id', mainPipeline.id)
        .eq('is_latest', true)
        .limit(10);

      if (sampleRecords && sampleRecords.length > 0) {
        sampleData = `\nSample records from "${mainPipeline.name}":\n${JSON.stringify(sampleRecords.map((r: any) => r.data), null, 1)}`;
      }

      // Also get recent changes
      const { data: recentVersions } = await supabase
        .from('record_versions')
        .select('change_summary, detected_at')
        .eq('pipeline_id', mainPipeline.id)
        .order('detected_at', { ascending: false })
        .limit(5);

      if (recentVersions && recentVersions.length > 0) {
        sampleData += `\n\nRecent changes:\n${recentVersions.map((v: any) => `- ${v.change_summary} (${v.detected_at})`).join('\n')}`;
      }
    }

    // Also get user's own product data
    if (imports.length > 0) {
      const { data: importRecords } = await supabase
        .from('import_records')
        .select('data')
        .eq('import_id', imports[0].id)
        .limit(10);

      if (importRecords && importRecords.length > 0) {
        sampleData += `\n\nYour products from "${imports[0].name}":\n${JSON.stringify(importRecords.map((r: any) => r.data), null, 1)}`;
      }
    }

    // Build message history from chat
    const existingMessages = (chat.messages as any[]) || [];

    let assistantResponse: string;

    // Route through Backboard.io if configured (enables persistent memory + node enrichment)
    if (isBackboardConfigured()) {
      assistantResponse = await handleWithBackboard(
        chat, user.id, message, dataContext, sampleData, existingMessages, supabase
      );
    } else {
      // Fallback: direct Gemini call
      assistantResponse = await handleWithGemini(
        message, dataContext, sampleData, existingMessages
      );
    }

    // Update chat with new messages
    const now = new Date().toISOString();
    const updatedMessages = [
      ...existingMessages,
      { role: 'user', content: message, timestamp: now },
      { role: 'assistant', content: assistantResponse, timestamp: now },
    ];

    await supabase
      .from('ai_chats')
      .update({
        messages: updatedMessages,
        updated_at: now,
      })
      .eq('id', chat.id);

    return jsonResponse(
      {
        chat_id: chat.id,
        message: assistantResponse,
        messages: updatedMessages,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

async function handleWithBackboard(
  chat: any,
  userId: string,
  message: string,
  dataContext: string,
  sampleData: string,
  existingMessages: any[],
  supabase: any
): Promise<string> {
  const context = chat.context || {};

  // Create or retrieve Backboard assistant (one per user)
  let assistantId = context.backboard_assistant_id;
  if (!assistantId) {
    const systemPrompt = `${CHAT_SYSTEM_PROMPT}\n\nUser data context:\n${dataContext}`;

    // Define tools the AI can call to query live data
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'query_pipeline_records',
          description: 'Query records from a specific pipeline with optional filters',
          parameters: {
            type: 'object',
            properties: {
              pipeline_name: { type: 'string', description: 'Name of the pipeline to query' },
              filter_field: { type: 'string', description: 'Field to filter on (optional)' },
              filter_value: { type: 'string', description: 'Value to filter for (optional)' },
              sort_field: { type: 'string', description: 'Field to sort by (optional)' },
              sort_direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
              limit: { type: 'number', description: 'Max records to return (default 20)' },
            },
            required: ['pipeline_name'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'query_price_changes',
          description: 'Get recent price changes and record versions',
          parameters: {
            type: 'object',
            properties: {
              pipeline_name: { type: 'string', description: 'Pipeline to check' },
              days: { type: 'number', description: 'Look back period in days (default 7)' },
            },
            required: ['pipeline_name'],
          },
        },
      },
    ];

    const assistant = await createBackboardAssistant(
      `NorthLens-${userId.slice(0, 8)}`,
      systemPrompt,
      tools
    );
    assistantId = assistant.assistant_id;

    // Save assistant ID to chat context
    await supabase
      .from('ai_chats')
      .update({ context: { ...context, backboard_assistant_id: assistantId } })
      .eq('id', chat.id);
  }

  // Create or retrieve thread
  let threadId = context.backboard_thread_id;
  if (!threadId) {
    const thread = await createBackboardThread(assistantId);
    threadId = thread.thread_id;

    // Seed thread with data context
    await sendBackboardMessage(threadId, `[System context] ${dataContext}\n${sampleData}`, {
      memory: 'Auto',
    });

    await supabase
      .from('ai_chats')
      .update({ context: { ...context, backboard_assistant_id: assistantId, backboard_thread_id: threadId } })
      .eq('id', chat.id);
  }

  // Send message with memory enabled (Backboard auto-saves/retrieves relevant context)
  let response = await sendBackboardMessage(threadId, message, { memory: 'Auto' });

  // Handle tool calls if the AI wants to query data
  if (response.status === 'REQUIRES_ACTION' && response.tool_calls) {
    const toolOutputs = [];

    for (const tc of response.tool_calls) {
      const args = tc.function.parsed_arguments;
      let output = '{}';

      if (tc.function.name === 'query_pipeline_records') {
        output = await executeQueryPipelineRecords(supabase, args);
      } else if (tc.function.name === 'query_price_changes') {
        output = await executeQueryPriceChanges(supabase, args);
      }

      toolOutputs.push({ tool_call_id: tc.id, output });
    }

    response = await submitBackboardToolOutputs(threadId, response.run_id!, toolOutputs);
  }

  return response.content || 'I apologize, I was unable to generate a response.';
}

async function handleWithGemini(
  message: string,
  dataContext: string,
  sampleData: string,
  existingMessages: any[]
): Promise<string> {
  // Build conversation history for Gemini
  const history = existingMessages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }));

  const fullSystemPrompt = `${CHAT_SYSTEM_PROMPT}\n\nUser data context:\n${dataContext}\n${sampleData}`;

  return await geminiGenerate(message, {
    systemPrompt: fullSystemPrompt,
    history,
    config: { temperature: 0.4, maxOutputTokens: 4096 },
  });
}

// Tool execution functions
async function executeQueryPipelineRecords(supabase: any, args: any): Promise<string> {
  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('id, name')
    .ilike('name', `%${args.pipeline_name}%`)
    .limit(1);

  if (!pipelines || pipelines.length === 0) return JSON.stringify({ error: 'Pipeline not found' });

  let query = supabase
    .from('records')
    .select('data, source_url, created_at')
    .eq('pipeline_id', pipelines[0].id)
    .eq('is_latest', true);

  if (args.sort_field) {
    query = query.order(`data->>${args.sort_field}`, { ascending: args.sort_direction === 'asc' });
  }

  const { data: records } = await query.limit(args.limit || 20);
  return JSON.stringify(records?.map((r: any) => r.data) || []);
}

async function executeQueryPriceChanges(supabase: any, args: any): Promise<string> {
  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('id')
    .ilike('name', `%${args.pipeline_name}%`)
    .limit(1);

  if (!pipelines || pipelines.length === 0) return JSON.stringify({ error: 'Pipeline not found' });

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - (args.days || 7));

  const { data: versions } = await supabase
    .from('record_versions')
    .select('old_data, new_data, changed_fields, change_summary, detected_at')
    .eq('pipeline_id', pipelines[0].id)
    .gte('detected_at', daysAgo.toISOString())
    .order('detected_at', { ascending: false })
    .limit(20);

  return JSON.stringify(versions || []);
}
