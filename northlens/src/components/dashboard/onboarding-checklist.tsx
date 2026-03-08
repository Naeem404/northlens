'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePipelines } from '@/hooks/use-pipelines';
import { useImports } from '@/hooks/use-imports';
import { useAlerts } from '@/hooks/use-alerts';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useProfile } from '@/hooks/use-profile';
import {
  Rocket, CheckCircle2, Circle, ArrowRight, Database,
  Upload, Bell, Bot, Settings, Sparkles, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Step {
  id: string;
  label: string;
  description: string;
  icon: typeof Rocket;
  href: string;
  check: boolean;
}

export function OnboardingChecklist() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const { data: profile } = useProfile();
  const { data: pipelines } = usePipelines();
  const { data: imports } = useImports();
  const { data: alerts } = useAlerts();
  const { data: dashData } = useDashboardData();

  const steps = useMemo<Step[]>(() => [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add your business details so AI can give personalized insights',
      icon: Settings,
      href: '/settings',
      check: !!(profile?.industry && profile?.location),
    },
    {
      id: 'pipeline',
      label: 'Create your first pipeline',
      description: 'Set up a competitor tracking pipeline to start collecting data',
      icon: Database,
      href: '/pipelines/new',
      check: (pipelines?.length ?? 0) > 0,
    },
    {
      id: 'run',
      label: 'Run a pipeline',
      description: 'Extract competitor data from the web',
      icon: Rocket,
      href: '/pipelines',
      check: (dashData?.stats.totalRecords ?? 0) > 0,
    },
    {
      id: 'import',
      label: 'Import your own data',
      description: 'Upload a CSV of your products to compare against competitors',
      icon: Upload,
      href: '/import',
      check: (imports?.length ?? 0) > 0,
    },
    {
      id: 'alert',
      label: 'Set up an alert',
      description: 'Get notified when competitor prices change',
      icon: Bell,
      href: '/alerts',
      check: (alerts?.length ?? 0) > 0,
    },
    {
      id: 'ai',
      label: 'Ask the AI Advisor',
      description: 'Use the AI chat to analyze your data and get recommendations',
      icon: Bot,
      href: '#ai',
      check: false, // Can't easily check this without chat history query
    },
  ], [profile, pipelines, imports, alerts, dashData]);

  const completedCount = steps.filter((s) => s.check).length;
  const allDone = completedCount === steps.length;
  const progress = (completedCount / steps.length) * 100;

  // Don't show if dismissed or if user has completed 4+ steps (experienced user)
  if (dismissed || completedCount >= 4) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-xl border border-primary/15 bg-primary/3 backdrop-blur-sm overflow-hidden mb-6"
    >
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors z-10"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Get Started with NorthLens</h3>
            <p className="text-[11px] text-muted-foreground/60">
              Complete these steps to unlock the full power of competitive intelligence
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              {completedCount} of {steps.length} complete
            </span>
            <span className="text-[10px] font-mono text-primary/60">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-1">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => {
                if (step.href === '#ai') {
                  // Can't navigate to AI panel from here, just dismiss
                  return;
                }
                router.push(step.href);
              }}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-left transition-all group ${
                step.check
                  ? 'opacity-50'
                  : 'hover:bg-primary/5 hover:border-primary/10'
              }`}
            >
              {step.check ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0 group-hover:text-primary/50 transition-colors" />
              )}
              <step.icon className={`h-3.5 w-3.5 shrink-0 ${step.check ? 'text-muted-foreground/30' : 'text-primary/40 group-hover:text-primary/70'} transition-colors`} />
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium block ${step.check ? 'line-through text-muted-foreground/40' : ''}`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground/40 block truncate">
                  {step.description}
                </span>
              </div>
              {!step.check && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary/50 transition-colors shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
