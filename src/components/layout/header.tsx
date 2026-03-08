'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, LogOut, Settings, User, Sparkles } from 'lucide-react';
import { NotificationBell } from '@/components/alerts/notification-bell';
import { useProfile } from '@/hooks/use-profile';
import { useExchangeRate } from '@/hooks/use-dashboard-data';

interface HeaderProps {
  onOpenSearch?: () => void;
  onOpenChat?: () => void;
}

export function Header({ onOpenSearch, onOpenChat }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { data: profile } = useProfile();
  const { data: exchangeRate } = useExchangeRate();

  const initials = profile?.business_name
    ? profile.business_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/40 bg-background/60 px-6 backdrop-blur-xl">
      {/* Search trigger — opens ⌘K palette */}
      <button
        onClick={onOpenSearch}
        className="flex h-9 w-72 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Canadian context — live exchange rate */}
        <span className="hidden text-xs text-muted-foreground lg:inline-flex items-center gap-1.5">
          🍁 CAD/USD: {exchangeRate?.cadUsd?.toFixed(4) ?? '0.7300'}
        </span>

        {/* AI Advisor quick access */}
        {onOpenChat && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenChat}>
            <Sparkles className="h-4 w-4 text-primary" />
          </Button>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-sm font-medium text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
