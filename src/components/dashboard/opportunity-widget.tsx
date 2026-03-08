'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface OpportunityWidgetProps {
  insight: string;
  onExplore?: () => void;
}

export function OpportunityWidget({ insight, onExplore }: OpportunityWidgetProps) {
  return (
    <Card className="group relative h-full overflow-hidden border-primary/15 card-glow">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/3" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/8 blur-3xl transition-all duration-700 group-hover:bg-primary/12" />
      <CardContent className="relative p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary animate-pulse-glow" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/70">
            Signal Detected
          </p>
        </div>
        <p className="font-display text-[15px] leading-relaxed text-foreground/85 italic">
          &ldquo;{insight}&rdquo;
        </p>
        {onExplore && (
          <Button size="sm" variant="outline" onClick={onExplore} className="gap-1.5 border-primary/20 text-primary hover:bg-primary/8 text-xs">
            Investigate <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
