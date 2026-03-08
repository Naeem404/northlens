// @ts-nocheck — dynamic SQL queries use untyped RPC calls
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Loader2, AlertCircle } from 'lucide-react';
import type { SavedQuery } from '@/types/database';

interface QueryTableWidgetProps {
  query: SavedQuery;
}

export function QueryTableWidget({ query }: QueryTableWidgetProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const supabase = createClient();

  async function runQuery() {
    setLoading(true);
    setError(null);
    try {
      // Security: only SELECT
      const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
      if (blocked.test(query.sql_query)) {
        setError('Only SELECT queries allowed');
        setLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('query-sql', {
        body: JSON.stringify({ sql: query.sql_query }),
      });

      if (fnError) {
        // Fallback: try RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('execute_readonly_query' as never, {
          query_text: query.sql_query,
        } as never);

        if (rpcError) {
          setError(rpcError.message);
        } else if (Array.isArray(rpcData) && rpcData.length > 0) {
          setColumns(Object.keys(rpcData[0]));
          setRows(rpcData as Record<string, unknown>[]);
        } else {
          setRows([]);
          setColumns([]);
        }
      } else if (data?.data && Array.isArray(data.data)) {
        if (data.data.length > 0) {
          setColumns(Object.keys(data.data[0]));
        }
        setRows(data.data);
      } else if (data?.error) {
        setError(data.error);
      }

      setLastRefreshed(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runQuery();
    // Auto-refresh every 60s
    const interval = setInterval(runQuery, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.sql_query]);

  return (
    <div className="relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden card-bezel">
      <div className="brass-edge" />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Database className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight truncate">{query.name}</h3>
              {query.description && (
                <p className="text-[10px] text-muted-foreground/60 truncate">{query.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!loading && (
              <Badge variant="secondary" className="text-[9px] font-mono">
                {rows.length} rows
              </Badge>
            )}
            <button
              onClick={runQuery}
              disabled={loading}
              className="rounded-md p-1 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground/50">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-5 py-4 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-6 text-center text-xs text-muted-foreground/50">
            No data returned
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  {columns.map((col) => (
                    <TableHead key={col} className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 py-2 px-3">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 20).map((row, i) => (
                  <TableRow key={i} className="border-border/20 hover:bg-primary/3">
                    {columns.map((col) => (
                      <TableCell key={col} className="font-mono text-[11px] py-1.5 px-3">
                        {row[col] === null ? (
                          <span className="text-muted-foreground/30">—</span>
                        ) : typeof row[col] === 'object' ? (
                          <span className="text-primary/70">{JSON.stringify(row[col])}</span>
                        ) : typeof row[col] === 'number' ? (
                          <span className="text-chart-1">{String(row[col])}</span>
                        ) : (
                          String(row[col])
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 20 && (
              <div className="px-3 py-1.5 text-[10px] text-muted-foreground/40 text-center">
                Showing 20 of {rows.length} rows
              </div>
            )}
          </ScrollArea>
        )}

        {/* Footer */}
        {lastRefreshed && (
          <div className="px-5 py-1.5 text-[9px] font-mono text-muted-foreground/30 border-t border-border/20">
            Refreshed {lastRefreshed.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
