'use client';

import { useRouter } from 'next/navigation';
import { usePipelines } from '@/hooks/use-pipelines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { Table2, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function TablesPage() {
  const router = useRouter();
  const { data: pipelines, isLoading } = usePipelines();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Data Records</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight italic">Tables</h1>
      </div>
      <div className="brass-line mb-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !pipelines || pipelines.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="No data tables yet"
          description="Create a pipeline first, then view its extracted data here."
          actionLabel="Create Pipeline"
          onAction={() => router.push('/pipelines/new')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              className="cursor-pointer transition-colors hover:border-primary/40"
              onClick={() => router.push(`/tables/${pipeline.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  {pipeline.name}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{pipeline.record_count} records</p>
                {pipeline.last_run_at && (
                  <p>Updated {formatRelativeTime(pipeline.last_run_at)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
