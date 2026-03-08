'use client';

import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlertEvents, useMarkAlertRead } from '@/hooks/use-alerts';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationBell() {
  const { data: events } = useAlertEvents();
  const markRead = useMarkAlertRead();
  const unreadCount = events?.filter((e) => !e.is_read).length ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative h-8 w-8" />
        }
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pulse-glow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Signals {unreadCount > 0 && `(${unreadCount})`}
          </h4>
          {unreadCount > 0 && (
            <button
              onClick={() => {
                events?.filter((e) => !e.is_read).forEach((e) => {
                  markRead.mutate(e.id);
                });
              }}
              className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-64">
          {!events || events.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground/50">
                No signals detected yet
              </p>
              <p className="text-[11px] text-muted-foreground/30">
                Create alerts to get notified when data changes
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 p-1.5">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => { if (!event.is_read) markRead.mutate(event.id); }}
                  className={`w-full rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted/30 ${
                    event.is_read ? 'opacity-40' : 'bg-primary/5 border-l-2 border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-foreground leading-snug">{event.summary}</p>
                    {!event.is_read && (
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/40">
                    {formatRelativeTime(event.triggered_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
