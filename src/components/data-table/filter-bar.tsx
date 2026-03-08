'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Filter {
  field: string;
  operator: string;
  value: string;
}

interface FilterBarProps {
  filters: Filter[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function FilterBar({ filters, onRemove, onClear }: FilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter, i) => (
        <Badge key={i} variant="secondary" className="gap-1 pr-1">
          {filter.field} {filter.operator} {filter.value}
          <button onClick={() => onRemove(i)} className="ml-1 rounded-sm hover:bg-muted">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear all
      </Button>
    </div>
  );
}
