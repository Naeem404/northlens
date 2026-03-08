'use client';

import { WidgetGrid } from '@/components/dashboard/widget-grid';
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist';
import { motion } from 'framer-motion';
import { TrendingUp, Compass } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const greeting = getGreeting();
  const businessName = profile?.business_name || 'your observatory';

  return (
    <div className="relative min-h-[calc(100vh-3.25rem)] p-6 lg:p-8">
      {/* Layered atmospheric depth */}
      <div className="pointer-events-none absolute inset-0 brass-mesh opacity-60" />
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-10" />

      <div className="relative z-10">
        {/* Header with orchestrated reveal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-end justify-between">
            <div className="flex items-start gap-4">
              {/* Compass icon with needle animation */}
              <motion.div
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 border border-primary/15"
              >
                <Compass className="h-5.5 w-5.5 text-primary" />
              </motion.div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1"
                >
                  Station Overview
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-[1.75rem] font-semibold tracking-tight italic leading-none"
                >
                  {greeting}, <span className="text-primary">{profile?.business_name?.split(' ')[0] || 'Navigator'}</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-1.5 text-[13px] text-muted-foreground/60"
                >
                  Here&apos;s the latest intelligence for {businessName}
                </motion.p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="hidden items-center gap-2 rounded-lg bg-success/6 border border-success/12 px-3 py-1.5 md:flex"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-breathe" />
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-success/80">Live Data</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="brass-line mt-6 origin-left"
          />
        </motion.div>

        <OnboardingChecklist />
        <WidgetGrid />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
