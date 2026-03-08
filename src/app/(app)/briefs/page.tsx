'use client';

import { useState } from 'react';
import { useGenerateBrief } from '@/hooks/use-ai-chat';
import { usePipelines } from '@/hooks/use-pipelines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { FileText, Loader2, Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function BriefsPage() {
  const [brief, setBrief] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const generateBrief = useGenerateBrief();
  const { data: pipelines } = usePipelines();

  async function handleGenerate() {
    try {
      const result = await generateBrief.mutateAsync();
      setBrief(result.brief);
      setGeneratedAt(new Date().toLocaleString('en-CA'));
      toast.success('Competitive brief generated!');
    } catch (err) {
      toast.error('Failed to generate brief. Ensure ai-brief edge function is deployed and GOOGLE_AI_API_KEY is set.');
    }
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 border border-primary/15">
              <FileText className="h-5.5 w-5.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Intelligence Reports</p>
              <h1 className="font-display text-[1.75rem] font-semibold tracking-tight italic leading-none">Competitive Briefs</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground/60">
                AI-generated weekly intelligence reports based on your pipeline data
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateBrief.isPending}
            className="h-11 gap-2 px-6"
          >
            {generateBrief.isPending ? (
              <Loader2 className="h-4 w-4 animate-dial-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Brief
          </Button>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="brass-line mt-6 origin-left"
        />
      </motion.div>

      {/* Pipeline context info */}
      {pipelines && pipelines.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {pipelines.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {p.name} ({p.record_count} records)
            </span>
          ))}
        </div>
      )}

      {/* Brief content */}
      {generateBrief.isPending ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-40 mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-52 mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : brief ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Competitive Brief
              </CardTitle>
              {generatedAt && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Generated {generatedAt}
                </span>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[70vh]">
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{brief}</ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No brief generated yet</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Click &quot;Generate Brief&quot; to create an AI-powered competitive intelligence report 
              based on your tracked pipeline data, market changes, and Canadian business context.
            </p>
            <Button onClick={handleGenerate} disabled={generateBrief.isPending}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Your First Brief
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
