'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Crosshair } from 'lucide-react';

interface OpportunityWidgetProps {
  insight: string;
  onExplore?: () => void;
}

export function OpportunityWidget({ insight, onExplore }: OpportunityWidgetProps) {
  return (
    <Card className="group relative h-full overflow-hidden card-glow card-bezel border-l-2 border-l-primary/40">
      {/* Atmospheric glow */}
      <div className="brass-edge" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-secondary/2" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/6 blur-3xl transition-all duration-700 group-hover:bg-primary/10" />

      <CardContent className="relative z-10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Crosshair className="h-3.5 w-3.5 text-primary/70" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/60 text-engraved">
            Signal Detected
          </p>
        </div>

        <p className="font-display text-[14px] leading-relaxed text-foreground/80 italic">
          &ldquo;{insight}&rdquo;
        </p>

        {onExplore && (
          <Button
            size="sm"
            variant="outline"
            onClick={onExplore}
            className="gap-1.5 border-primary/20 text-primary/80 hover:bg-primary/8 hover:border-primary/30 text-[11px] transition-all duration-300"
          >
            Investigate <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
