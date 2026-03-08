'use client';

import { cn, getChangeColor, getChangeArrow } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChangeIndicatorProps {
  currentValue: string | number;
  previousValue?: string | number;
  change?: number;
}

export function ChangeIndicator({ currentValue, previousValue, change }: ChangeIndicatorProps) {
  if (change === undefined || change === 0) {
    return <span>{currentValue}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center gap-1">
        <span>{currentValue}</span>
        <span className={cn('text-xs font-medium', getChangeColor(change))}>
          {getChangeArrow(change)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          Was: {previousValue}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
