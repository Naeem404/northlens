'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { usePipeline } from '@/hooks/use-pipelines';
import { useRecords } from '@/hooks/use-records';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { RecordHistorySheet } from '@/components/data-table/record-history-sheet';
import type { Json } from '@/types/database';

export default function DataTablePage() {
  const params = useParams();
  const pipelineId = params.pipelineId as string;

  const { data: pipeline, isLoading: pipelineLoading } = usePipeline(pipelineId);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordData, setSelectedRecordData] = useState<Record<string, unknown> | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: recordsData, isLoading: recordsLoading } = useRecords(pipelineId, {
    page,
    limit,
    sort: sorting[0]
      ? { column: sorting[0].id, ascending: !sorting[0].desc }
      : undefined,
  });

  const columns = useMemo<ColumnDef<Record<string, Json>>[]>(() => {
    if (!pipeline?.schema) return [];
    return pipeline.schema.map((field) => ({
      id: field.name,
      accessorFn: (row: Record<string, Json>) => row[field.name],
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {field.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const val = getValue();
        if (val === null || val === undefined) return <span className="text-muted-foreground">—</span>;
        if (field.type === 'currency') return `$${Number(val).toFixed(2)} CAD`;
        if (field.type === 'url') return (
          <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-secondary underline">
            {String(val).replace(/^https?:\/\//, '').slice(0, 30)}...
          </a>
        );
        return String(val);
      },
    }));
  }, [pipeline?.schema]);

  const tableData = useMemo(() => {
    if (!recordsData?.records) return [];
    const allData = recordsData.records.map((r) => r.data);
    if (!searchQuery.trim()) return allData;
    const q = searchQuery.toLowerCase();
    return allData.filter((row) =>
      Object.values(row).some((v) =>
        v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      )
    );
  }, [recordsData?.records, searchQuery]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const isLoading = pipelineLoading || recordsLoading;

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pipeline?.name || 'Data Table'}</h1>
          <p className="text-sm text-muted-foreground">
            {recordsData?.total ?? 0} records
            {pipeline?.last_run_at && ` · Updated ${formatRelativeTime(pipeline.last_run_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!recordsData?.records || !pipeline?.schema) return;
              const headers = pipeline.schema.map((f) => f.name);
              const csvRows = recordsData.records.map((r) =>
                headers.map((h) => {
                  const val = (r.data as Record<string, unknown>)?.[h];
                  if (val === null || val === undefined) return '';
                  return String(val).includes(',') ? `"${val}"` : String(val);
                }).join(',')
              );
              const csv = [headers.join(','), ...csvRows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${pipeline.name.replace(/\s+/g, '_')}_export.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('CSV exported!');
            }}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <EmptyState
                    icon={Search}
                    title="No records found"
                    description="Run your pipeline to start collecting data."
                  />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, rowIdx) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => {
                    const record = recordsData?.records[rowIdx];
                    if (record) {
                      setSelectedRecordId(record.id);
                      setSelectedRecordData(record.data as Record<string, unknown>);
                      setHistoryOpen(true);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(limit)} onValueChange={(v) => { if (v) { setLimit(Number(v)); setPage(1); } }}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {recordsData?.totalPages ?? 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(page + 1)}
            disabled={page >= (recordsData?.totalPages ?? 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Record History Sheet */}
      <RecordHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        recordId={selectedRecordId}
        recordData={selectedRecordData}
      />
    </div>
  );
}
