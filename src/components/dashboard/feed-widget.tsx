'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <Card className="h-full card-glow border-border/40">
      <CardContent className="p-5 pb-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">
          {title}
        </p>
        <ScrollArea className="h-56">
          {items.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground/50">
              No recent changes detected
            </p>
          ) : (
            <div className="space-y-0.5">
              {items.map((item, i) => (
                <div key={item.id} className="group flex gap-3 rounded-md p-2.5 transition-colors hover:bg-muted/20">
                  {/* Instrument notch indicator */}
                  <div className="mt-1.5 flex flex-col items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {i < items.length - 1 && <div className="w-px flex-1 bg-border/40" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug">{item.title}</p>
                    <p className="text-[12px] text-muted-foreground/60 mt-0.5">{item.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/40">
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
