'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecordHistory } from '@/hooks/use-records';
import { formatRelativeTime } from '@/lib/utils';
import { ArrowDown, ArrowUp, Clock, History } from 'lucide-react';

interface RecordHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string | null;
  recordData: Record<string, unknown> | null;
}

export function RecordHistorySheet({ open, onOpenChange, recordId, recordData }: RecordHistorySheetProps) {
  const { data: versions, isLoading } = useRecordHistory(recordId || '');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Record History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {/* Current Data */}
          {recordData && (
            <div className="border-b border-border py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Values
              </p>
              <div className="space-y-1.5">
                {Object.entries(recordData).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-xs font-medium">
                      {value !== null && value !== undefined ? String(value) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version History */}
          <div className="py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Change History
            </p>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : !versions || versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="mb-2 h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No version history yet</p>
                <p className="text-xs text-muted-foreground/60">
                  Changes will appear here after the next pipeline run
                </p>
              </div>
            ) : (
              <div className="relative space-y-3">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 h-full w-px bg-border" />

                {versions.map((version, i) => {
                  const changes = version.changed_fields as unknown as Record<string, { old: unknown; new: unknown }>;
                  return (
                    <div key={version.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute left-1.5 top-2 h-3 w-3 rounded-full border-2 border-primary bg-background" />

                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-[10px]">
                            v{version.version}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(version.detected_at)}
                          </span>
                        </div>

                        {changes && Object.keys(changes).length > 0 ? (
                          <div className="space-y-1.5">
                            {Object.entries(changes).map(([field, change]) => {
                              const oldVal = change?.old;
                              const newVal = change?.new;
                              const isNumeric = typeof oldVal === 'number' && typeof newVal === 'number';
                              const isIncrease = isNumeric && (newVal as number) > (oldVal as number);

                              return (
                                <div key={field} className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground min-w-[80px]">{field}</span>
                                  <span className="font-mono text-muted-foreground/60 line-through">
                                    {oldVal !== null && oldVal !== undefined ? String(oldVal) : '—'}
                                  </span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className={`font-mono font-medium ${
                                    isNumeric
                                      ? isIncrease
                                        ? 'text-red-400'
                                        : 'text-green-400'
                                      : 'text-foreground'
                                  }`}>
                                    {newVal !== null && newVal !== undefined ? String(newVal) : '—'}
                                    {isNumeric && (
                                      isIncrease
                                        ? <ArrowUp className="ml-0.5 inline h-3 w-3" />
                                        : <ArrowDown className="ml-0.5 inline h-3 w-3" />
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Initial version</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
