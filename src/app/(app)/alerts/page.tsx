'use client';

import { useState } from 'react';
import { useAlerts, useAlertEvents, useCreateAlert, useToggleAlert, useDeleteAlert } from '@/hooks/use-alerts';
import { usePipelines } from '@/hooks/use-pipelines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/empty-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { Bell, Plus, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const { data: events } = useAlertEvents();
  const { data: pipelines } = usePipelines();
  const createAlert = useCreateAlert();
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    pipeline_id: '',
    name: '',
    field: '',
    operator: 'gt' as const,
    value: '',
  });

  function handleCreate() {
    if (!newAlert.name || !newAlert.pipeline_id || !newAlert.field || !newAlert.value) {
      toast.error('Please fill in all fields');
      return;
    }
    createAlert.mutate(newAlert, {
      onSuccess: () => {
        toast.success('Alert created');
        setDialogOpen(false);
        setNewAlert({ pipeline_id: '', name: '', field: '', operator: 'gt', value: '' });
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Monitoring</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight italic">Alerts</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Alert
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                  placeholder="Price drop alert"
                />
              </div>
              <div className="space-y-2">
                <Label>Pipeline</Label>
                <Select
                  value={newAlert.pipeline_id}
                  onValueChange={(v) => setNewAlert({ ...newAlert, pipeline_id: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Input
                    value={newAlert.field}
                    onChange={(e) => setNewAlert({ ...newAlert, field: e.target.value })}
                    placeholder="price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={newAlert.operator}
                    onValueChange={(v) => v && setNewAlert({ ...newAlert, operator: v as typeof newAlert.operator })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">Greater than</SelectItem>
                      <SelectItem value="lt">Less than</SelectItem>
                      <SelectItem value="eq">Equals</SelectItem>
                      <SelectItem value="neq">Not equals</SelectItem>
                      <SelectItem value="gte">Greater or equal</SelectItem>
                      <SelectItem value="lte">Less or equal</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={newAlert.value}
                    onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createAlert.isPending}>
                {createAlert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Alerts */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Active Alerts</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alerts configured"
              description="Create an alert to get notified when your tracked data changes."
              actionLabel="Create Alert"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{alert.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.field} {alert.operator} {alert.value}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={(checked) => {
                          toggleAlert.mutate(
                            { alertId: alert.id, enabled: !!checked },
                            {
                              onSuccess: () => toast.success(checked ? 'Alert enabled' : 'Alert disabled'),
                              onError: (err) => toast.error(err.message),
                            }
                          );
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          deleteAlert.mutate(alert.id, {
                            onSuccess: () => toast.success('Alert deleted'),
                            onError: (err) => toast.error(err.message),
                          });
                        }}
                      >
                        <span className="text-xs">✕</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Alert History */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Alert History</h2>
          <Card>
            <ScrollArea className="h-80">
              {!events || events.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                  No alert events yet
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={`rounded-md px-3 py-2 text-sm ${
                        event.read ? 'opacity-60' : 'bg-muted/50'
                      }`}
                    >
                      <p>{event.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatRelativeTime(event.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
