'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface FeedItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

interface FeedWidgetProps {
  title: string;
  items: FeedItem[];
}

export function FeedWidget({ title, items }: FeedWidgetProps) {
  return (
    <Card className="h-full card-glow card-bezel overflow-hidden">
      <div className="brass-edge" />
      <CardContent className="relative z-10 p-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-3.5 w-3.5 text-warning/70" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50 text-engraved">
            {title}
          </p>
          {items.length > 0 && (
            <span className="ml-auto font-mono text-[9px] text-muted-foreground/30">
              {items.length} events
            </span>
          )}
        </div>
        <ScrollArea className="h-56 -mx-1 px-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-8 w-8 rounded-full border border-border/30 flex items-center justify-center mb-3">
                <Activity className="h-3.5 w-3.5 text-muted-foreground/25" />
              </div>
              <p className="text-[13px] text-muted-foreground/40">
                No changes detected yet
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {items.map((item, i) => (
                <div key={item.id} className="group flex gap-3 rounded-lg p-2.5 transition-all duration-200 hover:bg-primary/3">
                  {/* Timeline connector */}
                  <div className="mt-1 flex flex-col items-center gap-0.5">
                    <div className="h-2 w-2 rounded-full border border-primary/30 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                    {i < items.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-border/30 to-transparent" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-[13px] font-medium leading-snug text-foreground/85 group-hover:text-foreground transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                    <p className="mt-1.5 font-mono text-[9px] text-muted-foreground/30 uppercase tracking-wider">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
