'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Bot, User, Database, TrendingUp, AlertTriangle, Lightbulb, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

function tryParseJsonTable(code: string): Record<string, unknown>[] | null {
  try {
    const parsed = JSON.parse(code);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      return parsed;
    }
  } catch { /* not JSON */ }
  return null;
}

function InlineDataTable({ data }: { data: Record<string, unknown>[] }) {
  const columns = Object.keys(data[0]);
  return (
    <div className="my-2 overflow-hidden rounded-md border border-border/40 bg-background/40">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-border/30 bg-muted/20">
              {columns.map((col) => (
                <th key={col} className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((row, i) => (
              <tr key={i} className="border-b border-border/15 hover:bg-primary/3">
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1 font-mono text-[10px]">
                    {row[col] === null ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : typeof row[col] === 'number' ? (
                      <span className="text-chart-1">{String(row[col])}</span>
                    ) : (
                      String(row[col]).slice(0, 60)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 15 && (
        <div className="px-2 py-1 text-[9px] text-muted-foreground/40 text-center border-t border-border/15">
          Showing 15 of {data.length} rows
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="absolute top-1.5 right-1.5 rounded p-1 text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function detectInsightType(content: string): { icon: typeof Lightbulb; label: string; color: string } | null {
  const lower = content.toLowerCase();
  if (lower.includes('opportunity') || lower.includes('recommend') || lower.includes('suggest')) {
    return { icon: Lightbulb, label: 'Insight', color: 'text-chart-1' };
  }
  if (lower.includes('alert') || lower.includes('warning') || lower.includes('anomal') || lower.includes('drop')) {
    return { icon: AlertTriangle, label: 'Alert', color: 'text-warning' };
  }
  if (lower.includes('trend') || lower.includes('growth') || lower.includes('increase')) {
    return { icon: TrendingUp, label: 'Trend', color: 'text-success' };
  }
  if (lower.includes('query') || lower.includes('data') || lower.includes('record')) {
    return { icon: Database, label: 'Data', color: 'text-primary' };
  }
  return null;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';
  const insight = useMemo(() => !isUser ? detectInsightType(content) : null, [content, isUser]);

  return (
    <div className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
          isUser ? 'bg-primary/15 ring-1 ring-primary/20' : 'bg-muted/50 ring-1 ring-border/40'
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[88%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser
            ? 'bg-primary/10 text-foreground border border-primary/15'
            : 'bg-muted/20 text-foreground border border-border/25'
        )}
      >
        {/* Insight type badge for assistant messages */}
        {insight && (
          <div className={cn('flex items-center gap-1.5 mb-1.5 text-[9px] font-semibold uppercase tracking-wider', insight.color)}>
            <insight.icon className="h-3 w-3" />
            {insight.label}
          </div>
        )}

        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p]:last:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1 [&_strong]:text-foreground [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const codeStr = String(children).replace(/\n$/, '');
                  const isBlock = className?.includes('language-') || codeStr.includes('\n');

                  if (isBlock) {
                    // Try to render as data table if it's JSON array
                    const tableData = tryParseJsonTable(codeStr);
                    if (tableData) {
                      return <InlineDataTable data={tableData} />;
                    }

                    return (
                      <div className="relative my-2 rounded-md bg-background/60 border border-border/30 overflow-hidden">
                        <CopyButton text={codeStr} />
                        <pre className="overflow-x-auto p-3 text-[11px] font-mono leading-relaxed">
                          <code>{codeStr}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="rounded bg-muted/40 px-1 py-0.5 text-[11px] font-mono text-primary/80" {...props}>
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-2 overflow-hidden rounded-md border border-border/40 bg-background/40 overflow-x-auto">
                      <table className="w-full text-[10px]">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground/60 border-b border-border/30 bg-muted/20">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return <td className="px-2 py-1 font-mono text-[10px] border-b border-border/15">{children}</td>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
