'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent, getChangeArrow } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface KpiWidgetProps {
  title: string;
  value: number;
  format?: 'currency' | 'number' | 'rank';
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  rankOf?: number;
}

export function KpiWidget({
  title,
  value,
  format = 'currency',
  change,
  changeLabel = 'from last week',
  sparklineData,
  rankOf,
}: KpiWidgetProps) {
  const formattedValue =
    format === 'currency'
      ? formatCurrency(value)
      : format === 'rank'
        ? `#${value}`
        : value.toLocaleString('en-CA');

  const sparkData = sparklineData?.map((v, i) => ({ i, v }));

  const gradientId = `grad-${title.replace(/\s+/g, '-')}`;
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="group relative h-full overflow-hidden card-glow border-border/40">
      {/* Subtle warm glow on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl bg-primary/6" />
      </div>
      <CardContent className="relative p-5 space-y-3">
        {/* Instrument-style label */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
          {title}
        </p>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight">{formattedValue}</span>
          {format === 'rank' && rankOf && (
            <span className="font-mono text-xs text-muted-foreground/60">of {rankOf}</span>
          )}
        </div>

        {change !== undefined && (
          <div className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono font-medium ${
            change >= 0
              ? 'bg-success/8 text-success border border-success/15'
              : 'bg-destructive/8 text-destructive border border-destructive/15'
          }`}>
            <span>{getChangeArrow(change)}</span>
            <span>{formatPercent(change)}</span>
            <span className="font-sans font-normal text-muted-foreground/60 ml-0.5">{changeLabel}</span>
          </div>
        )}

        {sparkData && sparkData.length > 0 && (
          <div className="h-12 pt-1 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? 'hsl(155, 50%, 42%)' : 'hsl(4, 76%, 56%)'} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={isPositive ? 'hsl(155, 50%, 42%)' : 'hsl(4, 76%, 56%)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={isPositive ? 'hsl(155, 50%, 42%)' : 'hsl(4, 76%, 56%)'}
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
