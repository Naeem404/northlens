import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { invokeFunction } from '@/lib/api';
import type { AiChat } from '@/types/database';
import { useState, useCallback } from 'react';

function getSupabase() { return createClient(); }

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tool_calls?: unknown;
}

interface AiChatResponse {
  chat_id: string;
  response: string;
  messages: ChatMessage[];
}

export function useAiChats() {
  return useQuery({
    queryKey: ['ai-chats'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('ai_chats')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as AiChat[];
    },
  });
}

export function useAiChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: ['ai-chat-messages', chatId],
    queryFn: async () => {
      if (!chatId) return [] as ChatMessage[];
      const { data, error } = await getSupabase()
        .from('ai_chats')
        .select('*')
        .eq('id', chatId)
        .single();
      if (error) throw error;
      const chat = data as AiChat | null;
      return (chat?.messages as unknown as ChatMessage[]) || [];
    },
    enabled: !!chatId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async ({ chatId, content }: { chatId: string | null; content: string }): Promise<AiChatResponse> => {
      setIsLoading(true);
      try {
        const result = await invokeFunction<AiChatResponse>('ai-chat', {
          chat_id: chatId,
          message: content,
        });
        queryClient.invalidateQueries({ queryKey: ['ai-chats'] });
        if (result.chat_id) {
          queryClient.invalidateQueries({ queryKey: ['ai-chat-messages', result.chat_id] });
        }
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient]
  );

  return { sendMessage, isLoading };
}

export function useNlQuery() {
  return useMutation({
    mutationFn: async ({ question, pipelineId }: { question: string; pipelineId?: string }) => {
      return invokeFunction<{
        answer: string;
        sql: string;
        data: Record<string, unknown>[];
        row_count: number;
      }>('ai-nlq', { question, pipeline_id: pipelineId });
    },
  });
}

export function useGenerateBrief() {
  return useMutation({
    mutationFn: async () => {
      return invokeFunction<{ brief: string }>('ai-brief', {});
    },
  });
}

export function useGenerateSchema() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      return invokeFunction<{ schema: Array<{ name: string; type: string; description: string }> }>(
        'ai-schema-gen',
        { prompt }
      );
    },
  });
}
