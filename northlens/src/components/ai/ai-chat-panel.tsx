'use client';

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot, Send, Loader2, Plus, Sparkles, MessageSquare, Clock,
  TrendingUp, Target, ShieldAlert, FileText, Zap, Search,
  BarChart3, AlertTriangle, Database
} from 'lucide-react';
import { ChatMessage } from './chat-message';
import { useAiChats, useSendMessage, type ChatMessage as ChatMsg } from '@/hooks/use-ai-chat';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';
import type { AiChat } from '@/types/database';

interface AiChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: 'Price Analysis', prompt: "Analyze my current pricing position vs competitors. Show me where I'm priced above and below market, and recommend specific price adjustments with expected impact.", color: 'text-success' },
  { icon: ShieldAlert, label: 'Anomaly Scan', prompt: 'Scan all my pipeline data for anomalies — unusual price changes, missing data, outliers, and anything that needs my attention. Prioritize by severity.', color: 'text-warning' },
  { icon: FileText, label: 'Weekly Brief', prompt: 'Generate a comprehensive weekly competitive intelligence brief. Include market trends, notable competitor moves, pricing shifts, and strategic recommendations for the week ahead.', color: 'text-primary' },
  { icon: Target, label: 'Opportunities', prompt: 'Identify the top revenue opportunities in my data. Look at pricing gaps, underpriced competitors, seasonal trends, and untapped market segments. Rank them by potential impact.', color: 'text-chart-1' },
  { icon: BarChart3, label: 'Market Report', prompt: 'Create a market intelligence report comparing my product catalog against all tracked competitors. Include price distribution, competitive positioning, and market share insights.', color: 'text-secondary' },
  { icon: Search, label: 'Deep Dive', prompt: 'Do a deep-dive analysis on my most active pipeline. Break down the data by source, identify which competitors are most aggressive, and show me the price change velocity over time.', color: 'text-chart-3' },
];

const SUGGESTED_PROMPTS = [
  "What's my average price vs the market right now?",
  'Show me the biggest competitor price drops this week',
  'Which of my products are overpriced compared to competitors?',
  'What are the top 5 things I should do this week based on my data?',
  'Summarize my pipeline health — any issues I should know about?',
  'How does my pricing compare across different competitor sources?',
];

const THINKING_MESSAGES = [
  'Querying your pipeline data...',
  'Analyzing competitor records...',
  'Cross-referencing price history...',
  'Generating insights...',
  'Building recommendations...',
];

export function AiChatPanel({ open, onOpenChange }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isLoading } = useSendMessage();
  const { data: chatHistory } = useAiChats();
  const { data: dashData } = useDashboardData();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Animated thinking indicator
  useEffect(() => {
    if (!isLoading) { setThinkingStep(0); return; }
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Proactive insight based on user's data
  const proactiveInsight = (() => {
    if (!dashData) return null;
    const { totalRecords, totalPipelines, avgPrice, marketAvgPrice } = dashData.stats;
    if (totalRecords === 0) return { text: 'Create your first pipeline to start getting AI-powered insights about your market.', icon: Zap };
    if (avgPrice && marketAvgPrice) {
      const diff = ((avgPrice - marketAvgPrice) / marketAvgPrice) * 100;
      if (diff > 5) return { text: `Your prices are ${diff.toFixed(1)}% above market average. Ask me to identify repricing opportunities.`, icon: AlertTriangle };
      if (diff < -5) return { text: `You're ${Math.abs(diff).toFixed(1)}% below market — strong position! Ask me how to maximize margins.`, icon: TrendingUp };
    }
    if (dashData.recentChanges.length > 0) {
      return { text: `${dashData.recentChanges.length} price changes detected recently. Ask me to analyze them.`, icon: Database };
    }
    return { text: `Tracking ${totalRecords} records across ${totalPipelines} pipelines. Ask me anything about your data.`, icon: Sparkles };
  })();

  function handleNewChat() {
    setMessages([]);
    setChatId(null);
    setInput('');
    setShowHistory(false);
  }

  function loadChat(chat: AiChat) {
    setChatId(chat.id);
    const msgs = chat.messages as unknown as ChatMsg[];
    setMessages(msgs || []);
    setShowHistory(false);
  }

  async function handleSend(content?: string) {
    const text = content || input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const result = await sendMessage({ chatId, content: text });
      setChatId(result.chat_id);
      setMessages(result.messages);
    } catch {
      const errorMsg: ChatMsg = {
        role: 'assistant',
        content: 'I encountered an error connecting to the AI engine. Please verify your Supabase edge functions are deployed and the GOOGLE_AI_API_KEY environment variable is set.',
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
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-xl">
        {/* Header */}
        <SheetHeader className="border-b border-sidebar-border/40 px-5 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-background animate-breathe" />
              </div>
              <div>
                <span className="font-display text-sm font-semibold italic">NorthLens AI</span>
                <span className="block text-[9px] uppercase tracking-widest text-muted-foreground/40">Advisor Engine</span>
              </div>
            </SheetTitle>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(!showHistory)} title="Chat history">
                <Clock className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewChat} title="New conversation">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Chat history sidebar */}
        {showHistory && chatHistory && chatHistory.length > 0 && (
          <div className="border-b border-sidebar-border/40 bg-muted/10 px-4 py-2 max-h-48 overflow-y-auto">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1.5 font-semibold">Recent Conversations</p>
            {chatHistory.slice(0, 10).map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat)}
                className={`flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-primary/5 ${chatId === chat.id ? 'bg-primary/8 text-primary' : 'text-muted-foreground'}`}
              >
                <MessageSquare className="h-3 w-3 shrink-0" />
                <span className="truncate flex-1">{chat.title || 'Untitled'}</span>
                <span className="text-[9px] text-muted-foreground/30 shrink-0">{formatRelativeTime(chat.updated_at)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-5" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="py-6">
              {/* Proactive insight banner */}
              {proactiveInsight && (
                <div className="mb-5 rounded-lg border border-primary/15 bg-primary/4 p-3 flex items-start gap-2.5">
                  <proactiveInsight.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-primary/60 font-semibold mb-0.5">Proactive Insight</p>
                    <p className="text-xs text-foreground/80">{proactiveInsight.text}</p>
                  </div>
                </div>
              )}

              {/* Quick actions grid */}
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-semibold mb-2.5">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-muted/15 p-3 text-left transition-all hover:bg-muted/30 hover:border-border/60 hover:shadow-sm group"
                  >
                    <action.icon className={`h-4 w-4 shrink-0 mt-0.5 ${action.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    <div>
                      <span className="text-xs font-semibold block">{action.label}</span>
                      <span className="text-[10px] text-muted-foreground/50 line-clamp-2">{action.prompt.slice(0, 60)}...</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Suggested prompts */}
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-semibold mb-2">Ask Anything</p>
              <div className="space-y-1">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="flex items-center gap-2 w-full rounded-md border border-border/30 bg-muted/10 px-3 py-2 text-left text-[12px] transition-colors hover:bg-muted/30 hover:border-border/50"
                  >
                    <Sparkles className="h-3 w-3 text-primary/40 shrink-0" />
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
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border/40 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="rounded-lg bg-muted/20 border border-border/25 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground/50 font-mono">{THINKING_MESSAGES[thinkingStep]}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Quick follow-ups when in conversation */}
        {messages.length > 0 && !isLoading && (
          <div className="border-t border-sidebar-border/20 px-4 py-2 flex gap-1.5 overflow-x-auto">
            {['Go deeper', 'Show me the data', 'What should I do?', 'Compare sources'].map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="shrink-0 rounded-full border border-border/40 bg-muted/15 px-3 py-1 text-[10px] font-medium text-muted-foreground/60 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-sidebar-border/40 p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={messages.length > 0 ? 'Follow up...' : 'Ask your AI advisor anything...'}
              className="min-h-[42px] max-h-[120px] resize-none bg-background/50 text-[13px] rounded-lg"
              rows={1}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-[42px] w-[42px] rounded-lg"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-1.5 text-[9px] text-muted-foreground/30 text-center">
            Powered by Gemini 2.5 · Queries your live business data
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
