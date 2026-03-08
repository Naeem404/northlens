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
import { MoreHorizontal, Play, Eye, Pause, Trash2 } from 'lucide-react';
import { formatRelativeTime, truncate } from '@/lib/utils';
import type { Pipeline } from '@/types/database';

interface PipelineCardProps {
  pipeline: Pipeline;
  onView: () => void;
  onRun: () => void;
  onDelete: () => void;
}

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/8 text-success border-success/15', dot: 'bg-success' },
  running: { label: 'Running', className: 'bg-primary/8 text-primary border-primary/15', dot: 'bg-primary animate-pulse' },
  error: { label: 'Error', className: 'bg-destructive/8 text-destructive border-destructive/15', dot: 'bg-destructive' },
  paused: { label: 'Paused', className: 'bg-muted-foreground/8 text-muted-foreground border-muted-foreground/15', dot: 'bg-muted-foreground' },
};

export function PipelineCard({ pipeline, onView, onRun, onDelete }: PipelineCardProps) {
  const status = statusConfig[pipeline.status] || statusConfig.active;
  const sourceCount = pipeline.sources?.length ?? 0;
  const firstSource = pipeline.sources?.[0]?.url
    ? new URL(pipeline.sources[0].url).hostname
    : 'No sources';

  return (
    <Card className="card-glow card-bezel overflow-hidden relative">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">{pipeline.name}</CardTitle>
        </div>
        <Badge variant="outline" className={`gap-1.5 ${status.className}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>
          {pipeline.record_count} records
          {pipeline.last_run_at && ` · Updated ${formatRelativeTime(pipeline.last_run_at)}`}
        </p>
        <p>
          Sources: {firstSource}
          {sourceCount > 1 && ` +${sourceCount - 1}`}
        </p>
        <p>Schedule: {pipeline.schedule.charAt(0).toUpperCase() + pipeline.schedule.slice(1)}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" onClick={onView}>
          <Eye className="mr-1 h-3 w-3" />
          View Data
        </Button>
        <Button size="sm" variant="outline" onClick={onRun}>
          <Play className="mr-1 h-3 w-3" />
          Run Now
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button size="sm" variant="ghost" className="ml-auto h-8 w-8 p-0" />}
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
