// Parse AI chat messages for rich content rendering

export interface ParsedMessagePart {
  type: 'text' | 'code' | 'chart' | 'table' | 'tool_call' | 'tool_result';
  content: string;
  language?: string; // for code blocks
  chartConfig?: any; // for chart type
  tableData?: any;   // for table type
  toolName?: string;  // for tool_call type
}

export function parseAiMessage(content: string): ParsedMessagePart[] {
  const parts: ParsedMessagePart[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const chartRegex = /\[CHART:(\{[\s\S]*?\})\]/g;
  const tableRegex = /\[TABLE:(\{[\s\S]*?\})\]/g;

  let lastIndex = 0;
  const allMatches: { index: number; length: number; part: ParsedMessagePart }[] = [];

  // Find code blocks
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      part: { type: 'code', content: match[2], language: match[1] || 'sql' },
    });
  }

  // Find chart blocks
  while ((match = chartRegex.exec(content)) !== null) {
    try {
      const chartConfig = JSON.parse(match[1]);
      allMatches.push({
        index: match.index,
        length: match[0].length,
        part: { type: 'chart', content: '', chartConfig },
      });
    } catch {}
  }

  // Sort by position
  allMatches.sort((a, b) => a.index - b.index);

  // Build parts array with text between special blocks
  for (const m of allMatches) {
    if (m.index > lastIndex) {
      const text = content.slice(lastIndex, m.index).trim();
      if (text) parts.push({ type: 'text', content: text });
    }
    parts.push(m.part);
    lastIndex = m.index + m.length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) parts.push({ type: 'text', content: text });
  }

  // If no special blocks found, return whole content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}
