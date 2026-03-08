'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlertEvents } from '@/hooks/use-alerts';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationBell() {
  const { data: events } = useAlertEvents();
  const unreadCount = events?.filter((e) => !e.read).length ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative h-8 w-8" />
        }
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border/40 px-4 py-2.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Signals</h4>
        </div>
        <ScrollArea className="h-56">
          {!events || events.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-[13px] text-muted-foreground/50">
              No signals detected yet
            </div>
          ) : (
            <div className="space-y-0.5 p-1.5">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-md px-3 py-2 text-[13px] ${
                    event.read ? 'opacity-50' : 'bg-muted/20'
                  }`}
                >
                  <p className="text-foreground">{event.message}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/40">
                    {formatRelativeTime(event.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
