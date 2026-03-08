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
    <div className="relative min-h-[calc(100vh-3.25rem)] p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 brass-mesh opacity-40" />
      <div className="relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-end justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/8 border border-secondary/15">
              <RefreshCw className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Data Collection</p>
              <h1 className="font-display text-[1.75rem] font-semibold tracking-tight italic leading-none">Pipelines</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground/60">
                Manage your automated data extraction workflows
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/pipelines/new')} className="h-11 gap-2 px-6">
            <Plus className="h-4 w-4" />
            New Pipeline
          </Button>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="brass-line mt-6 origin-left"
        />
      </motion.div>

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
    </div>
  );
}
