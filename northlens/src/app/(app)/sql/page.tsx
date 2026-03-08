// @ts-nocheck — dynamic SQL queries use untyped RPC calls
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
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Clock, Sparkles, Save, Pin, PinOff, Trash2, FileText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNlQuery } from '@/hooks/use-ai-chat';
import { useSavedQueries, useSaveQuery, useDeleteQuery, useTogglePinQuery } from '@/hooks/use-saved-queries';
import type { SavedQuery } from '@/types/database';

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
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const nlQuery = useNlQuery();
  const { data: savedQueries } = useSavedQueries();
  const saveQuery = useSaveQuery();
  const deleteQuery = useDeleteQuery();
  const togglePin = useTogglePinQuery();

  const supabase = createClient();

  const TEMPLATES = [
    { name: 'All pipelines', sql: 'SELECT name, status, record_count, schedule, last_run_at FROM pipelines ORDER BY created_at DESC;' },
    { name: 'Price comparison', sql: "SELECT data->>'name' as product, data->>'price' as price, data->>'source' as source, source_url FROM records WHERE pipeline_id IN (SELECT id FROM pipelines LIMIT 1) ORDER BY last_updated_at DESC LIMIT 25;" },
    { name: 'Recent changes', sql: 'SELECT rv.version, rv.changed_fields, rv.change_summary, rv.detected_at FROM record_versions rv ORDER BY rv.detected_at DESC LIMIT 20;' },
    { name: 'Price drops', sql: "SELECT rv.change_summary, rv.detected_at, r.source_url FROM record_versions rv JOIN records r ON r.id = rv.record_id WHERE rv.change_summary ILIKE '%drop%' OR rv.change_summary ILIKE '%decrease%' ORDER BY rv.detected_at DESC LIMIT 15;" },
    { name: 'Import summary', sql: 'SELECT name, source_type, record_count, created_at FROM data_imports ORDER BY created_at DESC;' },
    { name: 'Alert events', sql: "SELECT ae.summary, ae.is_read, ae.triggered_at, a.name as alert_name FROM alert_events ae JOIN alerts a ON a.id = ae.alert_id ORDER BY ae.triggered_at DESC LIMIT 20;" },
  ];

  async function handleSave() {
    if (!saveName.trim() || !query.trim()) return;
    try {
      await saveQuery.mutateAsync({ name: saveName, sql_query: query, description: nlExplanation || '' });
      toast.success('Query saved');
      setSaveName('');
      setShowSave(false);
    } catch {
      toast.error('Failed to save query');
    }
  }

  function loadSaved(sq: SavedQuery) {
    setQuery(sq.sql_query);
    if (sq.description) setNlExplanation(sq.description);
    toast.info(`Loaded: ${sq.name}`);
  }

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
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={handleRun} disabled={running || !query.trim()}>
          {running ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Query
        </Button>

        {/* Save button */}
        {!showSave ? (
          <Button variant="outline" size="sm" onClick={() => setShowSave(true)} disabled={!query.trim()}>
            <Save className="mr-2 h-3.5 w-3.5" />
            Save
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Query name..."
              className="h-8 w-48 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSave(false); }}
              autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={!saveName.trim() || saveQuery.isPending}>
              {saveQuery.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSave(false)}>Cancel</Button>
          </div>
        )}

        {/* Templates dropdown */}
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            <FileText className="mr-2 h-3.5 w-3.5" />
            Templates
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-lg border border-border bg-popover shadow-lg">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(t.sql); setShowTemplates(false); toast.info(`Template: ${t.name}`); }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-primary/5 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="block text-[10px] font-mono text-muted-foreground/60 truncate mt-0.5">{t.sql.slice(0, 60)}...</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          Ctrl+Enter
        </kbd>
        {executionTime !== null && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {executionTime.toFixed(0)}ms
          </span>
        )}
      </div>

      {/* Saved Queries */}
      {savedQueries && savedQueries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Save className="h-3.5 w-3.5" />
              Saved Queries ({savedQueries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {savedQueries.map((sq) => {
                const isPinned = (sq.visualization_config as Record<string, unknown> | null)?.pinned_to_dashboard === true;
                return (
                  <div
                    key={sq.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-primary/3 transition-colors cursor-pointer group"
                    onClick={() => loadSaved(sq)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{sq.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/50 truncate">{sq.sql_query.slice(0, 80)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin.mutate({ id: sq.id, pinned: !isPinned }); }}
                        className={`rounded p-1 hover:bg-primary/10 ${isPinned ? 'text-primary' : 'text-muted-foreground/40'}`}
                        title={isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                      >
                        {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteQuery.mutate(sq.id); toast.success('Deleted'); }}
                        className="rounded p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isPinned && <Badge variant="secondary" className="text-[8px] ml-2 shrink-0">DASHBOARD</Badge>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
