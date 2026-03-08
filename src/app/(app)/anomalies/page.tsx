'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePipelines } from '@/hooks/use-pipelines';
import { invokeFunction } from '@/lib/api';
import { AlertTriangle, Loader2, Radar, Shield, TrendingDown, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Anomaly {
  record_id: string;
  field: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

const severityConfig = {
  high: { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertTriangle, label: 'Critical' },
  medium: { color: 'bg-warning/10 text-warning border-warning/20', icon: Zap, label: 'Warning' },
  low: { color: 'bg-secondary/10 text-secondary border-secondary/20', icon: Shield, label: 'Info' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function AnomaliesPage() {
  const { data: pipelines } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAt, setScannedAt] = useState<string | null>(null);

  async function handleScan() {
    if (!selectedPipeline) {
      toast.error('Select a pipeline to scan');
      return;
    }
    setIsScanning(true);
    try {
      const result = await invokeFunction<{ anomalies: Anomaly[] }>('ai-anomaly', {
        pipeline_id: selectedPipeline,
        lookback_days: 7,
      });
      setAnomalies(result.anomalies || []);
      setScannedAt(new Date().toLocaleString('en-CA'));
      toast.success(`Scan complete — ${result.anomalies?.length || 0} anomalies detected`);
    } catch {
      toast.error('Anomaly scan failed. Ensure ai-anomaly edge function is deployed.');
    } finally {
      setIsScanning(false);
    }
  }

  const highCount = anomalies.filter((a) => a.severity === 'high').length;
  const medCount = anomalies.filter((a) => a.severity === 'medium').length;
  const lowCount = anomalies.filter((a) => a.severity === 'low').length;

  return (
    <div className="relative min-h-[calc(100vh-3.25rem)] p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 brass-mesh opacity-40" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex items-end justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/8 border border-destructive/15">
                <Radar className="h-5.5 w-5.5 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
                  Threat Detection
                </p>
                <h1 className="font-display text-[1.75rem] font-semibold tracking-tight italic leading-none">
                  Anomaly Scanner
                </h1>
                <p className="mt-1.5 text-[13px] text-muted-foreground/60">
                  AI-powered detection of unusual changes in your competitive data
                </p>
              </div>
            </div>
          </div>
          <div className="brass-line mt-6" />
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
              Pipeline to Scan
            </label>
            <Select value={selectedPipeline} onValueChange={(v) => v && setSelectedPipeline(v)}>
              <SelectTrigger className="h-11 bg-background/40 border-border/60">
                <SelectValue placeholder="Select a pipeline..." />
              </SelectTrigger>
              <SelectContent>
                {pipelines?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.record_count} records)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleScan}
            disabled={isScanning || !selectedPipeline}
            className="h-11 gap-2 px-6"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-dial-spin" />
            ) : (
              <Radar className="h-4 w-4" />
            )}
            {isScanning ? 'Scanning...' : 'Run Anomaly Scan'}
          </Button>
        </motion.div>

        {/* Severity summary */}
        {anomalies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex gap-3"
          >
            {highCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-500/8 border border-red-500/15 px-3 py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] font-mono font-semibold text-red-400">{highCount} Critical</span>
              </div>
            )}
            {medCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-warning/8 border border-warning/15 px-3 py-1.5">
                <Zap className="h-3.5 w-3.5 text-warning" />
                <span className="text-[11px] font-mono font-semibold text-warning">{medCount} Warning</span>
              </div>
            )}
            {lowCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary/8 border border-secondary/15 px-3 py-1.5">
                <Shield className="h-3.5 w-3.5 text-secondary" />
                <span className="text-[11px] font-mono font-semibold text-secondary">{lowCount} Info</span>
              </div>
            )}
            {scannedAt && (
              <span className="ml-auto self-center text-[10px] font-mono text-muted-foreground/40">
                Scanned {scannedAt}
              </span>
            )}
          </motion.div>
        )}

        {/* Anomaly cards */}
        {isScanning ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : anomalies.length > 0 ? (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {anomalies.map((anomaly, i) => {
              const cfg = severityConfig[anomaly.severity];
              const Icon = cfg.icon;
              return (
                <motion.div key={`${anomaly.record_id}-${anomaly.field}-${i}`} variants={item}>
                  <Card className={`card-glow card-bezel relative overflow-hidden border-l-2 ${
                    anomaly.severity === 'high' ? 'border-l-red-500/50' :
                    anomaly.severity === 'medium' ? 'border-l-warning/50' :
                    'border-l-secondary/50'
                  }`}>
                    <div className="brass-edge" />
                    <CardContent className="relative z-10 flex gap-4 py-5">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${cfg.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground/40">
                            {anomaly.field}
                          </span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-foreground/90">{anomaly.description}</p>
                        <div className="mt-3 rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 mb-0.5">Recommendation</p>
                          <p className="text-[12px] text-muted-foreground leading-relaxed">{anomaly.recommendation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : !isScanning && scannedAt ? (
          <Card className="card-bezel">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-success/10 p-4">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold">All Clear</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                No anomalies detected in the last 7 days. Your competitive landscape appears stable.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-bezel">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4">
                <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16 text-muted-foreground/20" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <circle cx="32" cy="32" r="28" strokeDasharray="4 6" />
                  <circle cx="32" cy="32" r="20" strokeDasharray="2 4" opacity="0.5" />
                  <circle cx="32" cy="32" r="12" opacity="0.3" />
                  <line x1="32" y1="4" x2="32" y2="14" strokeWidth="1.2" />
                  <line x1="32" y1="50" x2="32" y2="60" strokeWidth="1.2" />
                  <line x1="4" y1="32" x2="14" y2="32" strokeWidth="1.2" />
                  <line x1="50" y1="32" x2="60" y2="32" strokeWidth="1.2" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold italic">Ready to Scan</h3>
              <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
                Select a pipeline and run the anomaly scanner. The AI will analyze recent data changes
                and flag unusual patterns that may require your attention.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
