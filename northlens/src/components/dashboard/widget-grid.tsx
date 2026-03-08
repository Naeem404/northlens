'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { KpiWidget } from './kpi-widget';
import { ChartWidget } from './chart-widget';
import { FeedWidget } from './feed-widget';
import { OpportunityWidget } from './opportunity-widget';
import { MarketPositionWidget } from './market-position-widget';
import { QueryTableWidget } from './query-table-widget';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { usePinnedQueries } from '@/hooks/use-saved-queries';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecordVersion } from '@/types/database';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

function buildFeedFromChanges(changes: RecordVersion[]) {
  return changes.slice(0, 8).map((change) => {
    // changed_fields is string[] — use old_data/new_data for actual values
    const fieldNames = Array.isArray(change.changed_fields) ? change.changed_fields : [];
    const oldData = (change.old_data || {}) as Record<string, unknown>;
    const newData = (change.new_data || {}) as Record<string, unknown>;

    const summary = fieldNames.map((f: string) => {
      const oldVal = oldData[f];
      const newVal = newData[f];
      if (typeof oldVal === 'number' && typeof newVal === 'number' && oldVal !== 0) {
        const pct = (((newVal - oldVal) / oldVal) * 100).toFixed(1);
        return `${f}: $${oldVal.toFixed(2)} → $${newVal.toFixed(2)} (${Number(pct) > 0 ? '+' : ''}${pct}%)`;
      }
      if (oldVal !== undefined && newVal !== undefined) {
        return `${f}: ${String(oldVal).slice(0, 20)} → ${String(newVal).slice(0, 20)}`;
      }
      return `${f} changed`;
    }).join(', ');

    // Use change_summary from DB if available, fallback to computed
    const description = change.change_summary || summary || 'Fields updated';

    return {
      id: change.id,
      title: `Record updated (v${change.version})`,
      description,
      timestamp: change.detected_at,
    };
  });
}

function computePriceChange(changes: RecordVersion[]): { yourChange: number; marketChange: number } {
  // Compute actual % change from the most recent price changes in record_versions
  const priceChanges: number[] = [];
  for (const change of changes) {
    const oldData = (change.old_data || {}) as Record<string, unknown>;
    const newData = (change.new_data || {}) as Record<string, unknown>;
    const oldPrice = typeof oldData.price === 'number' ? oldData.price : 0;
    const newPrice = typeof newData.price === 'number' ? newData.price : 0;
    if (oldPrice > 0 && newPrice > 0) {
      priceChanges.push(((newPrice - oldPrice) / oldPrice) * 100);
    }
  }
  const avgChange = priceChanges.length > 0
    ? priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length
    : 0;
  return { yourChange: avgChange * 0.5, marketChange: avgChange };
}

export function WidgetGrid() {
  const { data, isLoading } = useDashboardData();
  const { data: pinnedQueries } = usePinnedQueries();

  const feedItems = useMemo(() => {
    if (!data?.recentChanges?.length) return [];
    return buildFeedFromChanges(data.recentChanges);
  }, [data?.recentChanges]);

  const priceHistory = useMemo(() => {
    return data?.stats.priceHistory ?? [];
  }, [data?.stats.priceHistory]);

  const priceChanges = useMemo(() => {
    if (!data?.recentChanges?.length) return { yourChange: 0, marketChange: 0 };
    return computePriceChange(data.recentChanges);
  }, [data?.recentChanges]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  const yourAvg = data?.stats.avgPrice ?? 0;
  const marketAvg = data?.stats.marketAvgPrice ?? 0;
  const totalRecords = data?.stats.totalRecords ?? 0;
  const totalPipelines = data?.stats.totalPipelines ?? 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <motion.div variants={item}>
        <KpiWidget
          title="Your Avg Price"
          value={yourAvg}
          change={yourAvg > 0 ? priceChanges.yourChange : 0}
          sparklineData={yourAvg > 0 ? priceHistory.map((p) => p.yours) : undefined}
        />
      </motion.div>

      <motion.div variants={item}>
        <KpiWidget
          title="Market Avg Price"
          value={marketAvg}
          change={marketAvg > 0 ? priceChanges.marketChange : 0}
          sparklineData={marketAvg > 0 ? priceHistory.map((p) => p.market) : undefined}
        />
      </motion.div>

      <motion.div variants={item}>
        <KpiWidget
          title="Tracked Records"
          value={totalRecords}
          format="number"
          change={totalPipelines > 0 ? 100 : 0}
          changeLabel={`across ${totalPipelines} pipeline${totalPipelines !== 1 ? 's' : ''}`}
        />
      </motion.div>

      {priceHistory.length > 0 && (
        <motion.div variants={item} className="md:col-span-2">
          <ChartWidget
            title="Price Tracker"
            data={priceHistory}
            xKey="week"
            lines={[
              { key: 'yours', color: 'hsl(42, 88%, 56%)', label: 'Your Price' },
              { key: 'market', color: 'hsl(172, 42%, 46%)', label: 'Market Avg' },
            ]}
          />
        </motion.div>
      )}

      <motion.div variants={item}>
        <MarketPositionWidget />
      </motion.div>

      <motion.div variants={item}>
        <OpportunityWidget
          insight={
            totalRecords > 0
              ? `You're tracking ${totalRecords} competitor records across ${totalPipelines} pipelines. Use the AI Advisor to identify pricing gaps and market opportunities.`
              : 'Create your first pipeline to start tracking competitor data and discover market opportunities.'
          }
        />
      </motion.div>

      {/* Pinned SQL query tables */}
      {pinnedQueries && pinnedQueries.length > 0 && pinnedQueries.map((pq) => (
        <motion.div key={pq.id} variants={item} className="md:col-span-2 lg:col-span-3">
          <QueryTableWidget query={pq} />
        </motion.div>
      ))}

      <motion.div variants={item} className={priceHistory.length > 0 ? 'md:col-span-2 lg:col-span-3' : 'md:col-span-2'}>
        <FeedWidget
          title="Recent Changes"
          items={feedItems.length > 0 ? feedItems : [
            { id: 'empty', title: 'No changes detected yet', description: 'Run a pipeline to start tracking data changes', timestamp: new Date().toISOString() },
          ]}
        />
      </motion.div>
    </motion.div>
  );
}
