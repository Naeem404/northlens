import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-border/40" />
        <div className="absolute inset-1.5 rounded-full border border-border/20" />
        <Icon className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <h3 className="font-display text-base font-semibold italic mb-1">{title}</h3>
      <p className="mb-6 max-w-xs text-[13px] text-muted-foreground/60 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="font-semibold">{actionLabel}</Button>
      )}
    </div>
  );
}
