'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface InlineChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  color?: string;
}

export function InlineChart({ data, xKey, yKey, color = 'hsl(42, 88%, 56%)' }: InlineChartProps) {
  return (
    <div className="my-2 h-40 w-full rounded-md border border-border/40 bg-background/50 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey={xKey} tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} stroke="hsl(30, 6%, 25%)" />
          <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} stroke="hsl(30, 6%, 25%)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(30, 8%, 8%)',
              border: '1px solid hsl(42, 20%, 20%)',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
