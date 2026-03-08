'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import type { PipelineField } from '@/types/database';

interface SchemaEditorProps {
  fields: PipelineField[];
  onChange: (fields: PipelineField[]) => void;
}

export function SchemaEditor({ fields, onChange }: SchemaEditorProps) {
  function updateField(index: number, updates: Partial<PipelineField>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function addField() {
    onChange([...fields, { name: '', type: 'text', description: '' }]);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_120px_1fr_40px] gap-2 border-b border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>Field Name</span>
          <span>Type</span>
          <span>Description</span>
          <span />
        </div>
        {fields.map((field, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_120px_1fr_40px] gap-2 border-b border-border px-3 py-2 last:border-b-0"
          >
            <Input
              value={field.name}
              onChange={(e) => updateField(i, { name: e.target.value })}
              className="h-8 text-sm"
              placeholder="field_name"
            />
            <Select
              value={field.type}
              onValueChange={(v) => updateField(i, { type: v as PipelineField['type'] })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['text', 'number', 'currency', 'url', 'date', 'boolean', 'rating'].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={field.description || ''}
              onChange={(e) => updateField(i, { description: e.target.value })}
              className="h-8 text-sm"
              placeholder="Description"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeField(i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addField}>
        <Plus className="mr-1 h-3 w-3" />
        Add Field
      </Button>
    </div>
  );
}
