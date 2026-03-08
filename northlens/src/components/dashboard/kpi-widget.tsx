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

  const gradientId = `grad-${title.replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="group relative h-full overflow-hidden card-glow card-bezel">
      {/* Brass edge gleam */}
      <div className="brass-edge" />

      {/* Warm glow on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100">
        <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl ${isPositive ? 'bg-success/8' : 'bg-primary/6'}`} />
      </div>

      <CardContent className="relative z-10 p-5 space-y-3">
        {/* Instrument-style engraved label */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50 text-engraved">
            {title}
          </p>
          {/* Tiny dial indicator */}
          <div className="h-3 w-3 rounded-full border border-border/40 flex items-center justify-center">
            <div className={`h-1 w-1 rounded-full ${isPositive ? 'bg-success/60' : 'bg-destructive/60'}`} />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[1.75rem] font-bold tracking-tight leading-none">{formattedValue}</span>
          {format === 'rank' && rankOf && (
            <span className="font-mono text-xs text-muted-foreground/40">of {rankOf}</span>
          )}
        </div>

        {change !== undefined && (
          <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
            change >= 0
              ? 'bg-success/6 text-success/80 border border-success/12'
              : 'bg-destructive/6 text-destructive/80 border border-destructive/12'
          }`}>
            <span className="text-[11px]">{getChangeArrow(change)}</span>
            <span>{formatPercent(change)}</span>
            <span className="font-sans font-normal text-muted-foreground/40 ml-0.5">{changeLabel}</span>
          </div>
        )}

        {sparkData && sparkData.length > 0 && (
          <div className="h-14 pt-1 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? 'hsl(155, 50%, 42%)' : 'hsl(4, 76%, 56%)'} stopOpacity={0.25} />
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
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
