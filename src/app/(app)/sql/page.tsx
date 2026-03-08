'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Play, Loader2, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNlQuery } from '@/hooks/use-ai-chat';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function SqlConsolePage() {
  const [query, setQuery] = useState('SELECT * FROM pipelines LIMIT 10;');
  const [nlQuestion, setNlQuestion] = useState('');
  const [nlExplanation, setNlExplanation] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const nlQuery = useNlQuery();

  const supabase = createClient();

  async function handleNlQuery() {
    if (!nlQuestion.trim()) return;
    try {
      const result = await nlQuery.mutateAsync({ question: nlQuestion });
      if (result.sql) {
        setQuery(result.sql);
        setNlExplanation(result.answer);
        toast.success('SQL generated from your question');
      }
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        setColumns(Object.keys(result.data[0]));
        setResults(result.data as Record<string, unknown>[]);
      }
    } catch (err) {
      toast.error('Failed to generate SQL. Check that ai-nlq edge function is deployed.');
    }
  }

  async function handleRun() {
    if (!query.trim()) return;
    setRunning(true);
    const start = performance.now();

    try {
      // Security check: only allow SELECT queries
      const trimmed = query.trim();
      const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
      if (blocked.test(trimmed)) {
        toast.error('Only SELECT queries are allowed in the console');
        setRunning(false);
        return;
      }

      // Try RPC first, fallback to edge function
      let data: Record<string, unknown>[] | null = null;
      let errorMsg: string | null = null;

      const { data: rpcData, error: rpcError } = await supabase.rpc('execute_readonly_query' as never, {
        query_text: trimmed,
      } as never);

      if (rpcError) {
        // Fallback: try the ai-nlq edge function approach
        const { data: fnData, error: fnError } = await supabase.functions.invoke('query-sql', {
          body: JSON.stringify({ sql: trimmed }),
        });
        if (fnError) {
          errorMsg = fnError.message || rpcError.message;
        } else if (fnData?.data) {
          data = fnData.data;
        } else if (fnData?.error) {
          errorMsg = fnData.error;
        }
      } else {
        data = rpcData as Record<string, unknown>[] | null;
      }

      const elapsed = performance.now() - start;
      setExecutionTime(elapsed);

      if (errorMsg) {
        toast.error(errorMsg);
        setResults(null);
        setColumns([]);
      } else if (Array.isArray(data) && data.length > 0) {
        setColumns(Object.keys(data[0]));
        setResults(data);
        toast.success(`${data.length} rows returned`);
      } else {
        setResults([]);
        setColumns([]);
        toast.info('Query returned no results');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Query Engine</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight italic">SQL Console</h1>
      </div>
      <div className="brass-line" />

      {/* NLQ Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
              <Input
                value={nlQuestion}
                onChange={(e) => setNlQuestion(e.target.value)}
                placeholder="Ask in English: 'Show me all products under $100 from Canadian Tire'"
                className="pl-9"
                onKeyDown={(e) => { if (e.key === 'Enter') handleNlQuery(); }}
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleNlQuery}
              disabled={nlQuery.isPending || !nlQuestion.trim()}
            >
              {nlQuery.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate SQL
            </Button>
          </div>
          {nlExplanation && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              AI: {nlExplanation}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <div className="h-64 overflow-hidden rounded-lg">
            <MonacoEditor
              height="100%"
              language="sql"
              theme="vs-dark"
              value={query}
              onChange={(val) => setQuery(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-mono), monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button onClick={handleRun} disabled={running || !query.trim()}>
          {running ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Query
        </Button>
        <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          ⌘ Enter
        </kbd>
        {executionTime !== null && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {executionTime.toFixed(0)}ms
          </span>
        )}
      </div>

      {/* Results */}
      {results !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Results ({results.length} rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, i) => (
                    <TableRow key={i}>
                      {columns.map((col) => (
                        <TableCell key={col} className="font-mono text-xs">
                          {row[col] === null ? (
                            <span className="text-muted-foreground">NULL</span>
                          ) : typeof row[col] === 'object' ? (
                            JSON.stringify(row[col])
                          ) : (
                            String(row[col])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
