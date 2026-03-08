'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePipelines } from '@/hooks/use-pipelines';
import { useRecords } from '@/hooks/use-records';
import { ArrowDown, ArrowUp, GitCompare, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { Json } from '@/types/database';

export default function ComparePage() {
  const { data: pipelines } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [compareField, setCompareField] = useState<string>('');

  const { data: recordsData, isLoading } = useRecords(selectedPipeline, { limit: 100 });

  const pipeline = pipelines?.find((p) => p.id === selectedPipeline);
  const numericFields = useMemo(() => {
    if (!pipeline?.schema) return [];
    return pipeline.schema.filter((f) => f.type === 'currency' || f.type === 'number' || f.type === 'rating');
  }, [pipeline?.schema]);

  const comparisonData = useMemo(() => {
    if (!recordsData?.records || !compareField) return [];
    return recordsData.records
      .map((r) => {
        const data = r.data as Record<string, Json>;
        const name = data.name || data.product_name || data.productName || data.title || `Record`;
        const value = Number(data[compareField]) || 0;
        const source = (data.source_url as string) || r.source_url || '';
        const sourceLabel = source ? new URL(source).hostname.replace('www.', '') : 'Unknown';
        return { id: r.id, name: String(name), value, source: sourceLabel, sourceUrl: source };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => a.value - b.value);
  }, [recordsData?.records, compareField]);

  const avgValue = comparisonData.length > 0
    ? comparisonData.reduce((sum, d) => sum + d.value, 0) / comparisonData.length
    : 0;
  const minValue = comparisonData.length > 0 ? Math.min(...comparisonData.map((d) => d.value)) : 0;
  const maxValue = comparisonData.length > 0 ? Math.max(...comparisonData.map((d) => d.value)) : 0;

  const isCurrency = pipeline?.schema?.find((f) => f.name === compareField)?.type === 'currency';
  const fmt = (v: number) => isCurrency ? `$${v.toFixed(2)}` : v.toFixed(1);

  return (
    <div className="relative min-h-[calc(100vh-3.25rem)] p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 brass-mesh opacity-40" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-5/8 border border-chart-5/15">
              <GitCompare className="h-5.5 w-5.5 text-chart-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
                Competitive Analysis
              </p>
              <h1 className="font-display text-[1.75rem] font-semibold tracking-tight italic leading-none">
                Price Comparison
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground/60">
                Visual side-by-side comparison of competitor data across your pipelines
              </p>
            </div>
          </div>
          <div className="brass-line mt-6" />
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
              Pipeline
            </label>
            <Select value={selectedPipeline} onValueChange={(v) => { if (v) { setSelectedPipeline(v); setCompareField(''); } }}>
              <SelectTrigger className="h-11 bg-background/40 border-border/60">
                <SelectValue placeholder="Select a pipeline..." />
              </SelectTrigger>
              <SelectContent>
                {pipelines?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.record_count} records)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {numericFields.length > 0 && (
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                Compare Field
              </label>
              <Select value={compareField} onValueChange={(v) => v && setCompareField(v)}>
                <SelectTrigger className="h-11 bg-background/40 border-border/60">
                  <SelectValue placeholder="Select a numeric field..." />
                </SelectTrigger>
                <SelectContent>
                  {numericFields.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name.replace(/_/g, ' ')} ({f.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </motion.div>

        {/* Summary stats */}
        {comparisonData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 grid grid-cols-3 gap-3"
          >
            {[
              { label: 'Lowest', value: minValue, icon: TrendingDown, color: 'text-success' },
              { label: 'Average', value: avgValue, icon: Minus, color: 'text-muted-foreground' },
              { label: 'Highest', value: maxValue, icon: TrendingUp, color: 'text-destructive' },
            ].map((stat) => (
              <Card key={stat.label} className="card-bezel">
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{stat.label}</p>
                    <p className={`font-mono text-lg font-bold ${stat.color}`}>{fmt(stat.value)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Comparison bars */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : comparisonData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            {comparisonData.map((item, i) => {
              const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const isLowest = item.value === minValue;
              const isHighest = item.value === maxValue;
              const diffFromAvg = avgValue > 0 ? ((item.value - avgValue) / avgValue) * 100 : 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4, ease: 'easeOut' }}
                >
                  <Card className={`card-bezel overflow-hidden transition-all duration-300 hover:border-primary/30 ${
                    isLowest ? 'border-l-2 border-l-success/50' : isHighest ? 'border-l-2 border-l-destructive/50' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[13px] font-medium truncate max-w-[200px]">{item.name}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 text-muted-foreground/50">
                            {item.source}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-sm font-bold">{fmt(item.value)}</span>
                          {diffFromAvg !== 0 && (
                            <span className={`flex items-center gap-0.5 text-[10px] font-mono ${
                              diffFromAvg < 0 ? 'text-success/70' : 'text-destructive/70'
                            }`}>
                              {diffFromAvg < 0 ? <ArrowDown className="h-2.5 w-2.5" /> : <ArrowUp className="h-2.5 w-2.5" />}
                              {Math.abs(diffFromAvg).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Comparison bar */}
                      <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.1 * i + 0.3, duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            isLowest ? 'bg-success/60' : isHighest ? 'bg-destructive/60' : 'bg-primary/40'
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : selectedPipeline && compareField ? (
          <Card className="card-bezel">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">No numeric data found for this field.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-bezel">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4">
                <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16 text-muted-foreground/15" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <rect x="8" y="24" width="16" height="32" rx="2" strokeDasharray="3 4" />
                  <rect x="28" y="16" width="16" height="40" rx="2" strokeDasharray="3 4" />
                  <rect x="48" y="8" width="8" height="48" rx="2" strokeDasharray="3 4" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold italic">Compare Your Data</h3>
              <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
                Select a pipeline and a numeric field to see a visual comparison
                of values across all tracked records.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
