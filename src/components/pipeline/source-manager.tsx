'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import type { PipelineSource } from '@/types/database';

interface SourceManagerProps {
  sources: PipelineSource[];
  onChange: (sources: PipelineSource[]) => void;
}

export function SourceManager({ sources, onChange }: SourceManagerProps) {
  const [input, setInput] = useState('');

  function addSource() {
    if (!input.trim()) return;
    let url = input.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    onChange([...sources, { url, enabled: true }]);
    setInput('');
  }

  function removeSource(index: number) {
    onChange(sources.filter((_, i) => i !== index));
  }

  function toggleSource(index: number) {
    onChange(sources.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.ca/products"
          onKeyDown={(e) => e.key === 'Enter' && addSource()}
        />
        <Button onClick={addSource}>Add</Button>
      </div>
      {sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((source, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <Switch
                checked={source.enabled}
                onCheckedChange={() => toggleSource(i)}
              />
              <span className="flex-1 truncate">{source.url}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSource(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
