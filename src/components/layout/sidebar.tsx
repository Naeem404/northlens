'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  RefreshCw,
  Table2,
  Bot,
  Download,
  Bell,
  Terminal,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pipelines', href: '/pipelines', icon: RefreshCw },
  { label: 'Tables', href: '/tables', icon: Table2 },
  { label: 'Import', href: '/import', icon: Download },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'SQL', href: '/sql', icon: Terminal },
];

const bottomItems = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenChat: () => void;
}

function NavLink({ href, isActive, collapsed, icon: Icon, label }: {
  href: string;
  isActive: boolean;
  collapsed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const linkClasses = cn(
    'group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200',
    isActive
      ? 'bg-primary/8 text-primary'
      : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
  );

  const content = (
    <Link href={href} className={linkClasses}>
      {isActive && (
        <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon className={cn("h-[15px] w-[15px] shrink-0 transition-colors", isActive && "text-primary")} />
      {!collapsed && <span className="tracking-wide">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<Link href={href} className={linkClasses} />}>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
          )}
          <Icon className={cn("h-[15px] w-[15px] shrink-0", isActive && "text-primary")} />
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

export function Sidebar({ collapsed, onToggle, onOpenChat }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border/40 bg-sidebar backdrop-blur-xl transition-all duration-300 ease-out',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex h-13 items-center gap-2.5 border-b border-sidebar-border/40 px-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          <svg viewBox="0 0 28 28" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="14" cy="14" r="10" strokeDasharray="2 2.5" opacity="0.6" />
            <circle cx="14" cy="14" r="5" />
            <path d="M14 4 L14 7 M14 21 L14 24 M4 14 L7 14 M21 14 L24 14" strokeWidth="1" opacity="0.5" />
            <path d="M14 10 L15.5 14 L14 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-display text-base font-semibold tracking-tight italic text-foreground">
            NorthLens
          </span>
        )}
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            Instruments
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            isActive={pathname.startsWith(item.href)}
            collapsed={collapsed}
            icon={item.icon}
            label={item.label}
          />
        ))}

        {/* Brass separator */}
        <div className="my-3 mx-2 brass-line" />

        {/* AI Advisor button */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={onOpenChat}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                />
              }
            >
              <Bot className="h-[15px] w-[15px] shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right">AI Advisor</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onOpenChat}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
          >
            <Bot className="h-[15px] w-[15px] shrink-0" />
            <span className="tracking-wide">AI Advisor</span>
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="space-y-0.5 border-t border-sidebar-border/40 px-2 py-2">
        {bottomItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            isActive={pathname.startsWith(item.href)}
            collapsed={collapsed}
            icon={item.icon}
            label={item.label}
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-sidebar-foreground/35 hover:text-sidebar-foreground/60"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </aside>
  );
}
