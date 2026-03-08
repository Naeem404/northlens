'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  RefreshCw,
  Table2,
  Download,
  Bell,
  Terminal,
  Settings,
  Bot,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { usePipelines } from '@/hooks/use-pipelines';

interface CommandPaletteProps {
  onOpenChat: () => void;
}

export function CommandPalette({ onOpenChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: pipelines } = usePipelines();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runAction = useCallback(
    (action: () => void) => {
      setOpen(false);
      action();
    },
    []
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, pipelines, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runAction(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push('/pipelines'))}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Pipelines
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push('/tables'))}>
            <Table2 className="mr-2 h-4 w-4" />
            Tables
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push('/import'))}>
            <Download className="mr-2 h-4 w-4" />
            Import Data
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push('/alerts'))}>
            <Bell className="mr-2 h-4 w-4" />
            Alerts
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push('/briefs'))}>
            <Search className="mr-2 h-4 w-4" />
            Competitive Briefs
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push('/sql'))}>
            <Terminal className="mr-2 h-4 w-4" />
            SQL Console
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runAction(() => router.push('/pipelines/new'))}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Pipeline
          </CommandItem>
          <CommandItem onSelect={() => runAction(onOpenChat)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Open AI Advisor
          </CommandItem>
        </CommandGroup>

        {pipelines && pipelines.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pipelines">
              {pipelines.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => runAction(() => router.push(`/tables/${p.id}`))}
                >
                  <Table2 className="mr-2 h-4 w-4" />
                  {p.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {p.record_count} records
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
