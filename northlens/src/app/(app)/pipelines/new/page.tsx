'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatePipeline, useRunPipeline } from '@/hooks/use-pipelines';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Pencil, Plus, ArrowLeft, ArrowRight, Loader2, X, Sparkles, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateSchema } from '@/hooks/use-ai-chat';
import { invokeFunction } from '@/lib/api';
import type { PipelineField, PipelineSource } from '@/types/database';

const placeholders = [
  'Track winter jacket prices from Canadian Tire, MEC, and Atmosphere...',
  'Monitor competitor product reviews on Google...',
  'Find new regulations on Canada.ca related to my industry...',
  'Track job postings from competitors in my area...',
];

export default function NewPipelinePage() {
  const router = useRouter();
  const createPipeline = useCreatePipeline();
  const runPipeline = useRunPipeline();
  const generateSchema = useGenerateSchema();

  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [fields, setFields] = useState<PipelineField[]>([
    { name: 'product_name', type: 'text', description: 'Product name' },
    { name: 'price', type: 'currency', description: 'Current price' },
    { name: 'url', type: 'url', description: 'Product page URL' },
  ]);
  const [sources, setSources] = useState<PipelineSource[]>([]);
  const [sourceInput, setSourceInput] = useState('');
  const [schedule, setSchedule] = useState<'hourly' | 'daily' | 'weekly' | 'manual'>('daily');
  const [extraction_mode, setExtractionMode] = useState<'list' | 'detail'>('list');
  const [name, setName] = useState('');
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  async function handlePreviewExtract() {
    if (sources.length === 0 || fields.length === 0) {
      toast.error('Add at least one source URL and define your schema first');
      return;
    }
    setIsPreviewing(true);
    try {
      const schemaForExtract = fields.map((f) => ({
        name: f.name,
        type: f.type === 'currency' ? 'number' : f.type === 'text' ? 'string' : f.type === 'rating' ? 'number' : f.type,
        description: f.description || f.name,
      }));
      const result = await invokeFunction<{ records: Record<string, unknown>[]; source_url: string }>(
        'ai-extract',
        { url: sources[0].url, schema: schemaForExtract, mode: extraction_mode }
      );
      if (result.records && result.records.length > 0) {
        setPreviewData(result.records.slice(0, 10));
        toast.success(`Extracted ${result.records.length} records from ${sources[0].url}`);
      } else {
        toast.info('No records extracted. Try a different URL or adjust your schema.');
      }
    } catch (err) {
      toast.error('Extraction preview failed. The URL may be unreachable or the schema may not match the page content.');
    } finally {
      setIsPreviewing(false);
    }
  }

  function addSource() {
    if (!sourceInput.trim()) return;
    let url = sourceInput.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    setSources([...sources, { url, enabled: true }]);
    setSourceInput('');
  }

  function removeSource(index: number) {
    setSources(sources.filter((_, i) => i !== index));
  }

  function addField() {
    setFields([...fields, { name: '', type: 'text', description: '' }]);
  }

  function updateField(index: number, updates: Partial<PipelineField>) {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Please enter a pipeline name');
      return;
    }

    createPipeline.mutate(
      {
        name,
        prompt,
        schema: fields,
        sources,
        schedule,
        extraction_mode,
      },
      {
        onSuccess: (data) => {
          toast.success('Pipeline created! Starting first extraction...');
          // Auto-trigger first extraction run
          if (data?.id) {
            runPipeline.mutate(data.id, {
              onSuccess: () => toast.success('Extraction started — data will appear in Tables shortly'),
              onError: () => toast.info('Pipeline saved. Run extraction manually from the Pipelines page.'),
            });
          }
          router.push(`/tables/${data?.id || ''}`);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 text-muted-foreground/60 hover:text-foreground">
        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
        Back
      </Button>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Pipeline Builder</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight italic mb-2">New Pipeline</h1>
      <div className="brass-line mb-6" />

      {/* Step indicators — instrument gauge style */}
      <div className="mb-8 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              s <= step ? 'bg-primary' : 'bg-border/40'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Prompt */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Describe your data needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholders[0]}
              className="min-h-[120px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  if (!prompt.trim()) return;
                  setIsGenerating(true);
                  try {
                    const result = await generateSchema.mutateAsync(prompt);
                    if (result.schema && Array.isArray(result.schema)) {
                      setFields(result.schema.map((f: any) => ({
                        name: f.name,
                        type: (f.type === 'string' ? 'text' : f.type) as PipelineField['type'],
                        description: f.description || '',
                      })));
                      toast.success('Schema generated by AI!');
                    }
                  } catch (err) {
                    toast.error('AI schema generation failed, using defaults');
                  } finally {
                    setIsGenerating(false);
                    setStep(2);
                  }
                }}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-1 h-4 w-4" /> Generate Schema</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Schema */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Schema Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="grid grid-cols-[1fr_120px_1fr_40px] gap-2 border-b border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Field Name</span>
                <span>Type</span>
                <span>Description</span>
                <span />
              </div>
              {fields.map((field, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_1fr_40px] gap-2 border-b border-border px-3 py-2 last:border-b-0">
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(i, { name: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Select
                    value={field.type}
                    onValueChange={(v) => v && updateField(i, { type: v as PipelineField['type'] })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['text', 'number', 'currency', 'url', 'date', 'boolean', 'rating'].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={field.description || ''}
                    onChange={(e) => updateField(i, { description: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeField(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus className="mr-1 h-3 w-3" />
              Add Field
            </Button>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sources */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder="https://canadiantire.ca/category/jackets"
                onKeyDown={(e) => e.key === 'Enter' && addSource()}
              />
              <Button onClick={addSource}>Add</Button>
            </div>
            {sources.length > 0 && (
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                    <span className="flex-1 truncate">{source.url}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSource(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviewExtract}
                  disabled={isPreviewing || sources.length === 0}
                >
                  {isPreviewing ? (
                    <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Extracting...</>
                  ) : (
                    <><Eye className="mr-1 h-4 w-4" /> Test Extract</>
                  )}
                </Button>
                <Button onClick={() => setStep(4)}>
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Extraction Preview Table */}
            {previewData.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Preview: {previewData.length} records extracted</p>
                <div className="max-h-64 overflow-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {fields.map((f) => (
                          <TableHead key={f.name} className="text-xs whitespace-nowrap">{f.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i}>
                          {fields.map((f) => (
                            <TableCell key={f.name} className="text-xs max-w-[200px] truncate">
                              {row[f.name] !== null && row[f.name] !== undefined
                                ? f.type === 'currency' ? `$${Number(row[f.name]).toFixed(2)}` : String(row[f.name])
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Configuration */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pipeline Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Winter Jacket Prices"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={schedule} onValueChange={(v) => v && setSchedule(v as typeof schedule)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={extraction_mode} onValueChange={(v) => v && setExtractionMode(v as typeof extraction_mode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List (multiple items)</SelectItem>
                    <SelectItem value="detail">Detail (single item)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={() => setStep(5)}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Preview & Save */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{name || 'Unnamed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fields</span>
                <span className="font-medium">{fields.length} columns</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sources</span>
                <span className="font-medium">{sources.length} URLs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span className="font-medium capitalize">{schedule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium capitalize">{extraction_mode}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {fields.map((f) => (
                <Badge key={f.name} variant="secondary">{f.name}: {f.type}</Badge>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
              <Button onClick={handleSave} disabled={createPipeline.isPending}>
                {createPipeline.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Run Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
