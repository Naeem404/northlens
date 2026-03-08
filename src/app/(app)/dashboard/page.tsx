'use client';

import { WidgetGrid } from '@/components/dashboard/widget-grid';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.25rem)] p-6 lg:p-8">
      {/* Warm brass atmosphere */}
      <div className="pointer-events-none absolute inset-0 brass-mesh opacity-60" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Station Overview</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight italic">Dashboard</h1>
            </div>
            <div className="hidden items-center gap-1.5 rounded-md bg-success/8 border border-success/15 px-2.5 py-1 text-[11px] font-mono font-medium text-success md:flex">
              <TrendingUp className="h-3 w-3" />
              LIVE
            </div>
          </div>
          <div className="brass-line mt-5" />
        </motion.div>

        <WidgetGrid />
      </div>
    </div>
  );
}
