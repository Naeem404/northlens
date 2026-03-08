'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary/15 ring-1 ring-primary/20' : 'bg-muted/50 ring-1 ring-border/40'
        )}
      >
        {isUser ? (
          <User className="h-3 w-3 text-primary" />
        ) : (
          <Bot className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-md px-3 py-2 text-[13px] leading-relaxed',
          isUser
            ? 'bg-primary/10 text-foreground border border-primary/15'
            : 'bg-muted/30 text-foreground border border-border/30'
        )}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-primary/80">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
