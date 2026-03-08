'use client';

import { useMemo } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Target, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

export function MarketPositionWidget() {
  const { data } = useDashboardData();

  const position = useMemo(() => {
    if (!data) return null;
    const yourAvg = data.stats.avgPrice;
    const marketAvg = data.stats.marketAvgPrice;
    if (!yourAvg || !marketAvg) return null;

    const diff = ((yourAvg - marketAvg) / marketAvg) * 100;
    const label =
      diff < -5 ? 'Below Market' :
      diff > 5 ? 'Above Market' :
      'At Market';
    const color =
      diff < -5 ? 'text-success' :
      diff > 5 ? 'text-destructive' :
      'text-chart-1';
    const Icon =
      diff < -3 ? TrendingDown :
      diff > 3 ? TrendingUp :
      Minus;

    // Build price range buckets from records
    const priceBuckets: { label: string; count: number; isYours: boolean }[] = [];
    const allPrices: number[] = [];
    for (const record of data.records || []) {
      const d = record.data as Record<string, unknown>;
      const price = d?.price ?? d?.current_price ?? d?.currentPrice;
      const parsed = typeof price === 'number' ? price : typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]/g, '')) : NaN;
      if (!isNaN(parsed) && parsed > 0) allPrices.push(parsed);
    }

    if (allPrices.length > 0) {
      const min = Math.min(...allPrices);
      const max = Math.max(...allPrices);
      const range = max - min;
      const bucketSize = range / 5 || 1;
      for (let i = 0; i < 5; i++) {
        const lo = min + i * bucketSize;
        const hi = lo + bucketSize;
        const count = allPrices.filter((p) => p >= lo && (i === 4 ? p <= hi : p < hi)).length;
        const containsYours = yourAvg >= lo && yourAvg < hi + (i === 4 ? 1 : 0);
        priceBuckets.push({
          label: `${formatCurrency(lo, 'CAD').replace('CA', '').trim()}–${formatCurrency(hi, 'CAD').replace('CA', '').trim()}`,
          count,
          isYours: containsYours,
        });
      }
    }

    return { yourAvg, marketAvg, diff, label, color, Icon, priceBuckets };
  }, [data]);

  if (!position) {
    return (
      <div className="relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden card-bezel">
        <div className="brass-edge" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-engraved">Market Position</h3>
          </div>
          <p className="text-xs text-muted-foreground/50">
            Import your products and run pipelines to see your market position.
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...position.priceBuckets.map((b) => b.count), 1);

  return (
    <div className="relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden card-bezel">
      <div className="brass-edge" />
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-engraved">Market Position</h3>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${position.color}`}>
            <position.Icon className="h-3.5 w-3.5" />
            {position.label}
          </div>
        </div>

        {/* Price comparison */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mb-0.5">Your Avg</p>
            <p className="text-sm font-semibold font-mono text-primary">{formatCurrency(position.yourAvg)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mb-0.5">Market Avg</p>
            <p className="text-sm font-semibold font-mono">{formatCurrency(position.marketAvg)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mb-0.5">Difference</p>
            <p className={`text-sm font-semibold font-mono ${position.color}`}>{formatPercent(position.diff)}</p>
          </div>
        </div>

        {/* Price distribution histogram */}
        {position.priceBuckets.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-2">Price Distribution</p>
            <div className="space-y-1">
              {position.priceBuckets.map((bucket, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted-foreground/50 w-24 shrink-0 truncate">
                    {bucket.label}
                  </span>
                  <div className="flex-1 h-4 rounded-sm bg-muted/20 overflow-hidden relative">
                    <div
                      className={`h-full rounded-sm transition-all duration-500 ${
                        bucket.isYours ? 'bg-primary/60' : 'bg-muted-foreground/15'
                      }`}
                      style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                    />
                    {bucket.isYours && (
                      <div className="absolute right-1 top-0.5 text-[8px] font-bold text-primary">YOU</div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground/40 w-5 text-right">
                    {bucket.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
