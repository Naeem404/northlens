'use client';

import { useRouter } from 'next/navigation';
import { usePipelines, useRunPipeline, useDeletePipeline } from '@/hooks/use-pipelines';
import { PipelineCard } from '@/components/pipeline/pipeline-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PipelinesPage() {
  const router = useRouter();
  const { data: pipelines, isLoading } = usePipelines();
  const runPipeline = useRunPipeline();
  const deletePipeline = useDeletePipeline();

  function handleRun(id: string) {
    runPipeline.mutate(id, {
      onSuccess: () => toast.success('Pipeline run started'),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleDelete(id: string) {
    deletePipeline.mutate(id, {
      onSuccess: () => toast.success('Pipeline deleted'),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Data Collection</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight italic">Pipelines</h1>
        </div>
        <Button onClick={() => router.push('/pipelines/new')} size="sm" className="gap-1.5 font-semibold">
          <Plus className="h-3.5 w-3.5" />
          New Pipeline
        </Button>
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
          icon={RefreshCw}
          title="No pipelines yet"
          description="Create your first data extraction pipeline to start tracking market data."
          actionLabel="Create Pipeline"
          onAction={() => router.push('/pipelines/new')}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {pipelines.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onView={() => router.push(`/tables/${pipeline.id}`)}
              onRun={() => handleRun(pipeline.id)}
              onDelete={() => handleDelete(pipeline.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
