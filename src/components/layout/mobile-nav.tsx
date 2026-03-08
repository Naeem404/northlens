'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  RefreshCw,
  Table2,
  Bot,
  Download,
  Bell,
  Terminal,
  Settings,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pipelines', href: '/pipelines', icon: RefreshCw },
  { label: 'Tables', href: '/tables', icon: Table2 },
  { label: 'Import', href: '/import', icon: Download },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'SQL', href: '/sql', icon: Terminal },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface MobileNavProps {
  onOpenChat: () => void;
}

export function MobileNav({ onOpenChat }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0 bg-sidebar">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-13 items-center gap-2.5 border-b border-sidebar-border/40 px-4">
          <svg viewBox="0 0 28 28" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="14" cy="14" r="10" strokeDasharray="2 2.5" opacity="0.6" />
            <circle cx="14" cy="14" r="5" />
            <path d="M14 10 L15.5 14 L14 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-base font-semibold tracking-tight italic">NorthLens</span>
        </div>
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            Instruments
          </span>
        </div>
        <nav className="space-y-0.5 px-2 py-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary/8 text-primary'
                    : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon className={cn("h-[15px] w-[15px]", isActive && "text-primary")} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
          <div className="my-3 mx-2 brass-line" />
          <button
            onClick={() => { setOpen(false); onOpenChat(); }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
          >
            <Bot className="h-[15px] w-[15px]" />
            <span className="tracking-wide">AI Advisor</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
