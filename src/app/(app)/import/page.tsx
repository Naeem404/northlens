'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateImport } from '@/hooks/use-imports';
import type { PipelineField } from '@/types/database';

export default function ImportPage() {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [allCsvRows, setAllCsvRows] = useState<string[][]>([]);
  const [importName, setImportName] = useState('');
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
  const createImport = useCreateImport();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length > 0) {
          const headers = data[0];
          const rows = data.slice(1).filter(r => r.some(cell => cell.trim()));
          setCsvHeaders(headers);
          setCsvData(rows.slice(0, 5));
          setAllCsvRows(rows);
          const types: Record<string, string> = {};
          headers.forEach((h) => {
            // Auto-detect types
            const sampleValues = rows.slice(0, 10).map(r => r[headers.indexOf(h)]);
            const allNumeric = sampleValues.every(v => !isNaN(Number(v)) && v.trim() !== '');
            const hasDollar = sampleValues.some(v => v?.includes('$'));
            const isUrl = sampleValues.some(v => v?.startsWith('http'));
            if (hasDollar || h.toLowerCase().includes('price') || h.toLowerCase().includes('cost')) {
              types[h] = 'currency';
            } else if (allNumeric) {
              types[h] = 'number';
            } else if (isUrl || h.toLowerCase().includes('url') || h.toLowerCase().includes('link')) {
              types[h] = 'url';
            } else {
              types[h] = 'text';
            }
          });
          setColumnTypes(types);
          toast.success(`Parsed ${rows.length} rows from ${file.name}`);
        }
      },
      error: (err) => toast.error(`Parse error: ${err.message}`),
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Data Ingestion</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight italic">Import Data</h1>
      </div>
      <div className="brass-line mb-6" />

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="api" disabled>
            API (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4">
          {/* Drop zone */}
          <Card>
            <CardContent className="pt-6">
              <div
                {...getRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV file, or click to browse'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  CSV files up to 10MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {csvHeaders.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preview (first 5 rows)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {csvHeaders.map((h) => (
                            <TableHead key={h}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, i) => (
                          <TableRow key={i}>
                            {row.map((cell, j) => (
                              <TableCell key={j} className="text-sm">
                                {cell || <span className="text-muted-foreground">—</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Column mapping */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Column Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {csvHeaders.map((h) => (
                    <div key={h} className="flex items-center gap-4">
                      <span className="w-40 truncate text-sm font-medium">{h}</span>
                      <Select
                        value={columnTypes[h] || 'text'}
                        onValueChange={(v) =>
                          setColumnTypes((prev) => ({ ...prev, [h]: v ?? 'text' }))
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-end gap-4 pt-6">
                  <div className="flex-1 space-y-2">
                    <Label>Import Name</Label>
                    <Input
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                      placeholder="My Product Data"
                    />
                  </div>
                  <Button
                    disabled={!importName.trim() || createImport.isPending}
                    onClick={() => {
                      const schema: PipelineField[] = csvHeaders.map((h) => ({
                        name: h.replace(/\s+/g, '_').toLowerCase(),
                        type: (columnTypes[h] || 'text') as PipelineField['type'],
                        description: h,
                      }));
                      const records = allCsvRows.map((row) => {
                        const record: Record<string, unknown> = {};
                        csvHeaders.forEach((h, i) => {
                          const key = h.replace(/\s+/g, '_').toLowerCase();
                          const type = columnTypes[h] || 'text';
                          let val: unknown = row[i] || null;
                          if (val && type === 'number') val = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
                          if (val && type === 'currency') val = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
                          record[key] = val;
                        });
                        return record;
                      });
                      createImport.mutate(
                        { name: importName, schema, records, sourceType: 'csv' },
                        {
                          onSuccess: () => {
                            toast.success(`Imported ${records.length} records!`);
                            setCsvData([]);
                            setCsvHeaders([]);
                            setAllCsvRows([]);
                            setImportName('');
                            setColumnTypes({});
                          },
                          onError: (err) => toast.error(err.message),
                        }
                      );
                    }}
                  >
                    {createImport.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Import {allCsvRows.length} Records
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Manual data entry allows you to add records one by one.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                First import a CSV or create a pipeline to define your schema, then add records manually.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
