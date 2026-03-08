'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, Eye, Pause, Trash2, Globe, Clock, Database, Layers } from 'lucide-react';
import { formatRelativeTime, truncate } from '@/lib/utils';
import type { Pipeline } from '@/types/database';

interface PipelineCardProps {
  pipeline: Pipeline;
  onView: () => void;
  onRun: () => void;
  onDelete: () => void;
}

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/8 text-success border-success/15', dot: 'bg-success', barColor: 'bg-success/60' },
  running: { label: 'Running', className: 'bg-primary/8 text-primary border-primary/15', dot: 'bg-primary animate-pulse', barColor: 'bg-primary/60' },
  error: { label: 'Error', className: 'bg-destructive/8 text-destructive border-destructive/15', dot: 'bg-destructive', barColor: 'bg-destructive/60' },
  paused: { label: 'Paused', className: 'bg-muted-foreground/8 text-muted-foreground border-muted-foreground/15', dot: 'bg-muted-foreground', barColor: 'bg-muted-foreground/30' },
};

function getHealthScore(pipeline: Pipeline): number {
  let score = 0;
  if (pipeline.status === 'active') score += 30;
  if (pipeline.status === 'running') score += 25;
  if (pipeline.record_count > 0) score += 25;
  if (pipeline.last_run_at) {
    const hoursSinceRun = (Date.now() - new Date(pipeline.last_run_at).getTime()) / 3600000;
    if (hoursSinceRun < 24) score += 25;
    else if (hoursSinceRun < 168) score += 15;
    else score += 5;
  }
  if ((pipeline.sources?.length ?? 0) > 0) score += 20;
  return Math.min(score, 100);
}

export function PipelineCard({ pipeline, onView, onRun, onDelete }: PipelineCardProps) {
  const status = statusConfig[pipeline.status] || statusConfig.active;
  const sourceCount = pipeline.sources?.length ?? 0;
  const schemaFieldCount = pipeline.schema?.length ?? 0;
  const health = getHealthScore(pipeline);

  let firstSourceHost = 'No sources';
  try {
    if (pipeline.sources?.[0]?.url) {
      firstSourceHost = new URL(pipeline.sources[0].url).hostname;
    }
  } catch { /* invalid URL */ }

  return (
    <Card className="card-glow card-bezel overflow-hidden relative group">
      {/* Top health bar */}
      <div className="h-1 w-full bg-muted/20">
        <div
          className={`h-full transition-all duration-700 ${status.barColor}`}
          style={{ width: `${health}%` }}
        />
      </div>

      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-base font-semibold tracking-tight truncate">{pipeline.name}</CardTitle>
          {pipeline.description && (
            <p className="text-[11px] text-muted-foreground/50 truncate">{pipeline.description}</p>
          )}
        </div>
        <Badge variant="outline" className={`gap-1.5 shrink-0 ${status.className}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md bg-muted/15 border border-border/20 px-2 py-1.5 text-center">
            <Database className="h-3 w-3 text-primary/50 mx-auto mb-0.5" />
            <p className="text-xs font-semibold">{pipeline.record_count}</p>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40">Records</p>
          </div>
          <div className="rounded-md bg-muted/15 border border-border/20 px-2 py-1.5 text-center">
            <Globe className="h-3 w-3 text-secondary/50 mx-auto mb-0.5" />
            <p className="text-xs font-semibold">{sourceCount}</p>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40">Sources</p>
          </div>
          <div className="rounded-md bg-muted/15 border border-border/20 px-2 py-1.5 text-center">
            <Layers className="h-3 w-3 text-chart-1/50 mx-auto mb-0.5" />
            <p className="text-xs font-semibold">{schemaFieldCount}</p>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40">Fields</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="space-y-1 text-[11px] text-muted-foreground/60">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              {firstSourceHost}{sourceCount > 1 && ` +${sourceCount - 1}`}
            </span>
            <Badge variant="secondary" className="text-[8px] h-4 px-1.5">
              {pipeline.extraction_mode}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {pipeline.schedule.charAt(0).toUpperCase() + pipeline.schedule.slice(1)}
            </span>
            {pipeline.last_run_at && (
              <span className="text-[10px] text-muted-foreground/40">
                {formatRelativeTime(pipeline.last_run_at)}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" onClick={onView} className="flex-1">
          <Eye className="mr-1 h-3 w-3" />
          View Data
        </Button>
        <Button size="sm" variant="outline" onClick={onRun} className="flex-1">
          <Play className="mr-1 h-3 w-3" />
          Run Now
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button size="sm" variant="ghost" className="h-8 w-8 p-0" />}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
