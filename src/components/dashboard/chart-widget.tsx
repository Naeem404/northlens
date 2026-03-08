'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartWidgetProps {
  title: string;
  type?: 'line' | 'bar';
  data: Array<Record<string, unknown>>;
  xKey: string;
  lines?: Array<{ key: string; color: string; label: string }>;
}

const chartColors = [
  'hsl(42, 88%, 56%)',
  'hsl(172, 42%, 46%)',
  'hsl(18, 65%, 55%)',
  'hsl(155, 50%, 42%)',
  'hsl(260, 35%, 58%)',
];

export function ChartWidget({ title, type = 'line', data, xKey, lines }: ChartWidgetProps) {
  const lineConfigs = lines || [{ key: 'value', color: chartColors[0], label: 'Value' }];

  return (
    <Card className="h-full card-glow card-bezel overflow-hidden">
      <div className="brass-edge" />
      <CardContent className="relative z-10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-3 rounded-full bg-primary/30" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50 text-engraved">
            {title}
          </p>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 6%, 15%)" />
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
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }} />
                {lineConfigs.map((line, i) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={line.color || chartColors[i]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 6%, 15%)" />
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
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }} />
                {lineConfigs.map((line, i) => (
                  <Bar
                    key={line.key}
                    dataKey={line.key}
                    name={line.label}
                    fill={line.color || chartColors[i]}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
