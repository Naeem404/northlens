'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AiChatPanel } from '@/components/ai/ai-chat-panel';
import { CommandPalette } from '@/components/shared/command-palette';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle background texture */}
      <div className="pointer-events-none fixed inset-0 topo-pattern opacity-30" />

      {/* Command Palette (⌘K) */}
      <CommandPalette onOpenChat={() => setChatOpen(true)} />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenChat={() => setChatOpen(true)}
        />
      </div>

      {/* Main area */}
      <div
        className={cn(
          'relative flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-60'
        )}
      >
        <Header onOpenChat={() => setChatOpen(true)} onOpenSearch={() => {}} />

        {/* Mobile nav in header area */}
        <div className="fixed left-4 top-2.5 z-50 md:hidden">
          <MobileNav onOpenChat={() => setChatOpen(true)} />
        </div>

        <main className="relative flex-1">{children}</main>
      </div>

      {/* AI Chat slide-over */}
      <AiChatPanel open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
