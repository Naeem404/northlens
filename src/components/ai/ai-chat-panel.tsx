'use client';

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, Loader2, Plus, Sparkles } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { useSendMessage, type ChatMessage as ChatMsg } from '@/hooks/use-ai-chat';
import { toast } from 'sonner';

interface AiChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const suggestedPrompts = [
  "What's my average price vs the market?",
  'Show me recent competitor price changes',
  'Generate a weekly competitive brief',
  'Which products have the best margin opportunity?',
  'Compare my prices to Canadian Tire',
  'What anomalies have you detected this week?',
];

export function AiChatPanel({ open, onOpenChange }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isLoading } = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function handleNewChat() {
    setMessages([]);
    setChatId(null);
    setInput('');
  }

  async function handleSend(content?: string) {
    const text = content || input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const result = await sendMessage({ chatId, content: text });
      setChatId(result.chat_id);
      // Use the full messages array from the server (includes the assistant response)
      setMessages(result.messages);
    } catch (err) {
      const errorMsg: ChatMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the AI. Please check your Supabase edge functions are deployed and GOOGLE_AI_API_KEY is set.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error('AI request failed');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sidebar-border/40 px-5 py-3.5">
          <SheetTitle className="flex items-center gap-2.5">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold italic">AI Advisor</span>
          </SheetTitle>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-5" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-5 relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-primary/15" />
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-base font-semibold italic mb-1">NorthLens Advisor</h3>
              <p className="mb-6 text-[13px] text-muted-foreground/60">
                Query your data, analyze competitors, and discover market signals.
              </p>
              <div className="grid w-full gap-1.5">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted/40 hover:border-border/60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg, i) => (
                <ChatMessage key={`${i}-${msg.role}`} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/60" />
                  Processing signal...
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-sidebar-border/40 p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query your instruments..."
              className="min-h-[40px] max-h-[120px] resize-none bg-background/50 text-[13px]"
              rows={1}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-10 w-10"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
