# AGENT 2: Frontend Application
## NorthLens — Next.js 15 + shadcn/ui + TailwindCSS

---

## YOUR ROLE
You are building the **entire frontend application** for NorthLens. This includes the Next.js project setup, all pages, all UI components, styling, layout, routing, and client-side state management. You consume APIs built by Agent 1 (Backend) and render AI responses from Agent 3 (Intelligence).

**You own every pixel the user sees.**

---

## PRODUCT CONTEXT (Read This First)

NorthLens is a web platform combining LightFeed-style web data pipelines with Triple Whale-style analytics for small Canadian businesses. Users:
1. Create data extraction pipelines via natural language prompts
2. View extracted data in powerful, dynamic tables
3. Build customizable dashboards with KPI widgets and charts
4. Chat with an AI advisor about their data
5. Import their own business data (CSV, manual)
6. Set up alerts for competitive changes

**Design philosophy:** Dark-mode-first, Canadian-inspired (red + blue accents), modern SaaS dashboard. Think Linear meets Vercel meets Triple Whale. Clean, data-dense, beautiful.

---

## PROJECT SETUP

Initialize the project at `northlens/` in the HackCanada GitHub repo:

```bash
npx create-next-app@latest northlens --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd northlens
```

### Dependencies to install:

```bash
# UI Framework
npx shadcn@latest init
npx shadcn@latest add button card input label textarea select dialog sheet tabs badge separator skeleton avatar dropdown-menu popover command tooltip scroll-area switch table sonner

# Data & State
npm install @tanstack/react-query @tanstack/react-table @tanstack/react-virtual

# Charts & Dashboard
npm install recharts react-grid-layout
npm install -D @types/react-grid-layout

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Utilities
npm install lucide-react framer-motion react-hook-form @hookform/resolvers zod
npm install react-markdown react-dropzone papaparse
npm install -D @types/papaparse

# Monaco Editor (for SQL console)
npm install @monaco-editor/react
```

---

## PROJECT STRUCTURE (You own everything under `src/` except `src/lib/supabase/` and `src/types/`)

```
northlens/
├── .env.local                          ← Agent 1 provides values
├── package.json                        ← YOU CREATE
├── next.config.ts                      ← YOU CREATE
├── tailwind.config.ts                  ← YOU CREATE (custom theme)
├── middleware.ts                        ← YOU CREATE (auth redirect)
├── src/
│   ├── app/
│   │   ├── globals.css                 ← YOU CREATE (Tailwind + custom vars)
│   │   ├── layout.tsx                  ← YOU CREATE (root layout, providers)
│   │   ├── page.tsx                    ← YOU CREATE (landing/redirect)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx          ← YOU CREATE
│   │   │   └── signup/page.tsx         ← YOU CREATE
│   │   └── (app)/
│   │       ├── layout.tsx              ← YOU CREATE (sidebar + header shell)
│   │       ├── dashboard/page.tsx      ← YOU CREATE
│   │       ├── pipelines/
│   │       │   ├── page.tsx            ← YOU CREATE (pipeline list)
│   │       │   └── new/page.tsx        ← YOU CREATE (pipeline builder)
│   │       ├── tables/
│   │       │   └── [pipelineId]/page.tsx ← YOU CREATE (data table view)
│   │       ├── import/page.tsx         ← YOU CREATE (data-in)
│   │       ├── alerts/page.tsx         ← YOU CREATE
│   │       ├── sql/page.tsx            ← YOU CREATE (SQL console)
│   │       └── settings/page.tsx       ← YOU CREATE
│   ├── components/
│   │   ├── ui/                         ← shadcn components (auto-generated)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx             ← YOU CREATE
│   │   │   ├── header.tsx              ← YOU CREATE
│   │   │   └── mobile-nav.tsx          ← YOU CREATE
│   │   ├── dashboard/
│   │   │   ├── widget-grid.tsx         ← YOU CREATE
│   │   │   ├── kpi-widget.tsx          ← YOU CREATE
│   │   │   ├── chart-widget.tsx        ← YOU CREATE
│   │   │   ├── feed-widget.tsx         ← YOU CREATE
│   │   │   └── opportunity-widget.tsx  ← YOU CREATE
│   │   ├── pipeline/
│   │   │   ├── pipeline-card.tsx       ← YOU CREATE
│   │   │   ├── pipeline-builder.tsx    ← YOU CREATE
│   │   │   ├── schema-editor.tsx       ← YOU CREATE
│   │   │   └── source-manager.tsx      ← YOU CREATE
│   │   ├── data-table/
│   │   │   ├── data-table.tsx          ← YOU CREATE (main table component)
│   │   │   ├── column-header.tsx       ← YOU CREATE
│   │   │   ├── filter-bar.tsx          ← YOU CREATE
│   │   │   ├── change-indicator.tsx    ← YOU CREATE
│   │   │   └── export-button.tsx       ← YOU CREATE
│   │   ├── ai/
│   │   │   ├── ai-chat-panel.tsx       ← YOU CREATE (slide-over chat)
│   │   │   ├── chat-message.tsx        ← YOU CREATE
│   │   │   ├── chat-input.tsx          ← YOU CREATE
│   │   │   └── inline-chart.tsx        ← YOU CREATE
│   │   ├── import/
│   │   │   ├── csv-uploader.tsx        ← YOU CREATE
│   │   │   ├── column-mapper.tsx       ← YOU CREATE
│   │   │   └── manual-entry.tsx        ← YOU CREATE
│   │   ├── alerts/
│   │   │   ├── alert-card.tsx          ← YOU CREATE
│   │   │   ├── alert-builder.tsx       ← YOU CREATE
│   │   │   └── notification-bell.tsx   ← YOU CREATE
│   │   └── shared/
│   │       ├── loading-skeleton.tsx    ← YOU CREATE
│   │       ├── empty-state.tsx         ← YOU CREATE
│   │       ├── error-boundary.tsx      ← YOU CREATE
│   │       └── canadian-context.tsx    ← YOU CREATE (CAD/USD, weather badge)
│   ├── hooks/
│   │   ├── use-pipelines.ts            ← YOU CREATE
│   │   ├── use-records.ts              ← YOU CREATE
│   │   ├── use-dashboard.ts            ← YOU CREATE
│   │   ├── use-ai-chat.ts             ← YOU CREATE
│   │   ├── use-alerts.ts              ← YOU CREATE
│   │   └── use-profile.ts             ← YOU CREATE
│   ├── lib/
│   │   ├── supabase/                   ← Agent 1 provides these files
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── api.ts                      ← YOU CREATE (API client wrapper)
│   │   └── utils.ts                    ← YOU CREATE (formatters, helpers)
│   ├── types/
│   │   └── database.ts                 ← Agent 1 provides this file
│   └── providers/
│       └── query-provider.tsx          ← YOU CREATE (TanStack Query)
```

---

## DESIGN SYSTEM

### Color Palette (CSS Custom Properties in globals.css)

```css
@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 95%;
    --card: 240 6% 8%;
    --card-foreground: 0 0% 95%;
    --popover: 240 6% 8%;
    --popover-foreground: 0 0% 95%;
    --primary: 355 83% 56%;       /* #E63946 Canadian Red */
    --primary-foreground: 0 0% 100%;
    --secondary: 204 37% 44%;     /* #457B9D Canadian Blue */
    --secondary-foreground: 0 0% 100%;
    --muted: 240 5% 15%;
    --muted-foreground: 240 5% 55%;
    --accent: 240 5% 15%;
    --accent-foreground: 0 0% 95%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 5% 17%;
    --input: 240 5% 17%;
    --ring: 355 83% 56%;
    --radius: 0.5rem;

    /* Custom NorthLens tokens */
    --success: 145 63% 49%;      /* #2ECC71 */
    --warning: 36 100% 50%;       /* #F39C12 */
    --change-up: 145 63% 49%;
    --change-down: 0 72% 51%;
  }
}
```

### Typography
- Font: `Inter` (import from Google Fonts in layout.tsx)
- Mono: `JetBrains Mono` (for SQL console, code blocks)
- Headings: font-semibold or font-bold
- Body: font-normal (400) or font-medium (500)

### Spacing & Radius
- Cards: `rounded-lg` (8px)
- Inputs: `rounded-md` (6px)
- Badges: `rounded` (4px)
- Page padding: `p-6`
- Card padding: `p-4` or `p-6`
- Gap between cards: `gap-4` or `gap-6`

---

## PAGE SPECIFICATIONS

### Page 1: Auth — Login (`/login`) & Signup (`/signup`)

Simple, clean auth forms using Supabase Auth:
- Email + password login/signup
- Google OAuth button
- "Sign up for NorthLens" / "Welcome back" headings
- Centered card on dark background
- NorthLens logo (🍁 emoji + "NorthLens" text) at top
- After signup → redirect to `/dashboard`
- After login → redirect to `/dashboard`

### Page 2: App Shell Layout (`/(app)/layout.tsx`)

Persistent sidebar + header wrapping all app pages:

**Sidebar (collapsible, 240px wide):**
```
┌─────────────────┐
│ 🍁 NorthLens    │
├─────────────────┤
│ 📊 Dashboard    │  → /dashboard
│ 🔄 Pipelines    │  → /pipelines
│ 📋 Tables       │  → /tables (shows pipeline list to pick)
│ 🤖 AI Advisor   │  → opens slide-over panel
│ 📥 Import Data  │  → /import
│ 🔔 Alerts       │  → /alerts
│ 💻 SQL Console  │  → /sql
├─────────────────┤
│ ⚙️ Settings     │  → /settings
│ 👤 Profile      │  → dropdown
└─────────────────┘
```

Use Lucide icons (not emoji — emoji above is just for spec clarity):
- `LayoutDashboard`, `RefreshCw`, `Table2`, `Bot`, `Download`, `Bell`, `Terminal`, `Settings`, `User`

**Header:**
- Search bar (command palette style, ⌘K shortcut)
- Notification bell with unread count badge
- User avatar dropdown (Settings, Logout)
- Canadian context bar: `☀️ -8°C Waterloo | CAD/USD: 0.73` (small, right-aligned)

### Page 3: Dashboard (`/dashboard`)

**Layout:** Grid of draggable, resizable widgets using `react-grid-layout`.

**Default widgets (6):**

1. **KPI Card: "Your Avg Price"** — Shows average price of user's products, trend arrow, sparkline
2. **KPI Card: "Market Avg Price"** — Shows average across all pipeline records
3. **KPI Card: "Market Position"** — Shows rank (e.g., "#3 of 12"), trend
4. **Line Chart: "Price Tracker"** — Multi-line chart: your price vs competitors over time (Recharts `LineChart`)
5. **Feed: "Recent Changes"** — Scrollable list of recent `record_versions` with change summaries
6. **Opportunity Card** — AI-generated insight with action button

**KPI Widget Component (`kpi-widget.tsx`):**
```
┌─────────────────────────┐
│ Your Avg Price           │
│                          │
│ $142.50                  │  ← Large number
│ ↓ 2.1% from last week   │  ← Trend with color (green up, red down)
│ [sparkline chart]        │  ← Tiny area chart (Recharts AreaChart)
└─────────────────────────┘
```

**Chart Widget Component (`chart-widget.tsx`):**
- Wraps `Recharts` components
- Config-driven: type (line, bar, radar), data source, fields
- Responsive, auto-resize within grid cell
- Legend, tooltips, axis labels

**Feed Widget Component (`feed-widget.tsx`):**
```
┌─────────────────────────┐
│ Recent Changes           │
│                          │
│ ⚡ Canadian Tire dropped │
│   Arctic Parka by 15%   │
│   2 hours ago            │
│                          │
│ ⚡ MEC added 3 new       │
│   winter products        │
│   5 hours ago            │
└─────────────────────────┘
```

**Opportunity Widget (`opportunity-widget.tsx`):**
```
┌─────────────────────────┐
│ 🎯 Opportunity Detected  │
│                          │
│ "No competitor offers a  │
│  waterproof cycling      │
│  jacket under $150 CAD." │
│                          │
│ [Explore →]              │
└─────────────────────────┘
```

### Page 4: Pipeline List (`/pipelines`)

Card grid showing all user pipelines:

**Pipeline Card (`pipeline-card.tsx`):**
```
┌──────────────────────────────────┐
│ Winter Jacket Prices         🟢  │  ← Status indicator
│                                  │
│ 28 records · Updated 2h ago      │
│ Sources: canadiantire.ca +2      │
│ Schedule: Daily                  │
│                                  │
│ [View Data] [Run Now] [⋯]       │  ← Actions
└──────────────────────────────────┘
```

- "New Pipeline" button → navigates to `/pipelines/new`
- Status colors: 🟢 active, 🟡 running, 🔴 error, ⚪ paused
- "⋯" menu: Edit, Pause, Delete

### Page 5: Pipeline Builder (`/pipelines/new`)

**Step 1: Prompt**
- Large textarea: "Describe what data you want to track..."
- Placeholder examples that rotate: "Track winter jacket prices from Canadian Tire...", "Monitor competitor product reviews on Google...", "Find new regulations on Canada.ca..."
- "Generate Schema →" button

**Step 2: Schema Preview**
- Editable table showing generated fields: name, type, description
- Each row has edit (pencil) and delete (trash) icons
- "+ Add Field" button at bottom

**Step 3: Sources**
- URL input with "Add Source" button
- List of added sources with enable/disable toggle and delete
- Auto-suggestion: when user types a domain, suggest common paths

**Step 4: Configuration**
- Schedule selector: Hourly, Daily, Weekly, Manual
- Mode selector: List (multiple items) or Detail (single item)
- Pipeline name input

**Step 5: Preview & Save**
- "Preview Extraction" button → calls `/api/pipeline/preview` → shows results in mini table
- "Save & Run Pipeline" button → creates pipeline and triggers first run
- Loading states with skeleton UI

### Page 6: Data Table (`/tables/[pipelineId]`)

**This is a critical, complex component. Build it well.**

**Header bar:**
- Pipeline name + record count + last updated time
- Search input (semantic search)
- Filter button → opens filter popover
- Column visibility toggle
- Export dropdown (CSV, JSON)
- "Create Chart" button

**Table (`data-table.tsx`):**
Built on TanStack Table v8 with:

- **Dynamic columns** generated from pipeline schema
- **Server-side pagination** (page size selector: 20, 50, 100)
- **Column sorting** (click header, multi-sort with shift+click)
- **Column resizing** (drag column borders)
- **Row selection** (checkbox column)
- **Change indicators**: If a cell value changed since last extraction:
  - Show small arrow (↑ green / ↓ red) next to value
  - Show previous value in muted text on hover (tooltip)
  - Highlight cell with subtle colored border

**Change Indicator Component (`change-indicator.tsx`):**
```tsx
// If record has a version with changed_fields including this column:
// Show: $159.99 ↓ (was $189.00) with red tint
// Or:   4.8 ↑ (was 4.5) with green tint
```

**Filter Bar (`filter-bar.tsx`):**
- Chips showing active filters
- "Add Filter" → popover with field selector, operator, value
- Operators: equals, not equals, greater than, less than, contains, starts with
- "Clear All" button

### Page 7: AI Chat Panel (`ai-chat-panel.tsx`)

**This is a slide-over panel, not a full page.** Accessible from any page via sidebar button or keyboard shortcut (⌘J).

Uses `Sheet` component from shadcn (slides in from right, 400px wide).

**Chat UI:**
- Message list (scrollable, auto-scroll to bottom)
- User messages: right-aligned, primary color background
- AI messages: left-aligned, card background
- Support for:
  - Markdown rendering (react-markdown)
  - Code blocks (SQL queries) with syntax highlighting
  - Inline charts (Recharts rendered inside message)
  - Loading indicator (typing dots animation)
  - Tool call indicators ("🔍 Searching records...", "📊 Generating chart...")

**Chat Input:**
- Textarea with auto-resize
- Send button (or Enter to send, Shift+Enter for newline)
- Suggested prompts above input when chat is empty:
  - "What's my price vs the market?"
  - "Show me recent competitor changes"
  - "Generate a competitive brief"
  - "Which products should I reprice?"

**Streaming:** Use `EventSource` or `fetch` with streaming reader to consume SSE from the AI endpoint. Append tokens to the current assistant message as they arrive.

### Page 8: Import Data (`/import`)

**Tab interface:** CSV Upload | Manual Entry | API

**CSV Upload tab:**
1. Drag-and-drop zone (react-dropzone)
2. Parse CSV client-side (papaparse)
3. Show preview table (first 5 rows)
4. Column mapping interface: for each CSV column, select the target field name and type
5. Name input for the import
6. "Import" button → sends to backend

**Manual Entry tab:**
- Define schema (or select from existing import)
- Form to add records one by one
- Table showing added records

### Page 9: Alerts (`/alerts`)

**Two sections:**
1. **Active Alerts** — Card list of configured alerts with toggle, edit, delete
2. **Alert History** — Feed of triggered alert events (mark as read)

**Alert Builder (dialog):**
- Pipeline selector
- Field selector (from pipeline schema)
- Condition: operator + value
- Delivery method: In-app only (email/webhook shown as "coming soon")
- Name input

### Page 10: SQL Console (`/sql`)

- Monaco Editor (dark theme) for SQL input
- "Run Query" button (⌘Enter shortcut)
- Results table below editor
- Execution time display
- Save query button → dialog with name input
- Saved queries sidebar/dropdown

### Page 11: Settings (`/settings`)

- Business profile form (name, type, industry, location, website)
- API key display (Supabase anon key for external integrations)
- Plan information
- Logout button

---

## HOOKS (TanStack Query)

All data fetching goes through custom hooks using TanStack Query. Each hook wraps Supabase client calls.

### `use-pipelines.ts`
```typescript
// usePipelines() — fetch all pipelines for current user
// usePipeline(id) — fetch single pipeline
// useCreatePipeline() — mutation to create pipeline
// useRunPipeline() — mutation to trigger pipeline run
// useDeletePipeline() — mutation to delete pipeline
```

### `use-records.ts`
```typescript
// useRecords(pipelineId, { filters, sort, page, limit }) — paginated records
// useRecordHistory(recordId) — version history
// useRecordSearch(pipelineId, query) — semantic search
```

### `use-dashboard.ts`
```typescript
// useDashboard() — fetch default dashboard + widgets
// useWidgetData(widgetId) — fetch data for a specific widget
// useUpdateLayout() — mutation to save widget positions
```

### `use-ai-chat.ts`
```typescript
// useAiChats() — list all chats
// useAiChat(chatId) — single chat with messages
// useSendMessage() — mutation that handles streaming response
```

### `use-alerts.ts`
```typescript
// useAlerts() — all alerts for user
// useAlertEvents() — unread alert events
// useCreateAlert() — mutation
// useMarkAlertRead() — mutation
```

### `use-profile.ts`
```typescript
// useProfile() — current user's profile
// useUpdateProfile() — mutation
```

**Pattern for all hooks:** Use Supabase client directly from `@/lib/supabase/client`. For Edge Function calls, use `supabase.functions.invoke('function-name', { body })`.

---

## API CLIENT WRAPPER

Create `src/lib/api.ts`:
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function invokeFunction<T>(name: string, body?: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body ? JSON.stringify(body) : undefined,
  });
  if (error) throw error;
  return data as T;
}

// For streaming (AI chat)
export async function invokeFunctionStream(
  name: string,
  body: any,
  onChunk: (chunk: string) => void,
  onDone: () => void
) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) { onDone(); break; }
    onChunk(decoder.decode(value));
  }
}
```

---

## UTILITY FUNCTIONS

Create `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-muted-foreground';
}

export function getChangeArrow(change: number): string {
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '—';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
```

---

## ANIMATION GUIDELINES (Framer Motion)

- **Page transitions:** `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}`
- **Card hover:** `whileHover={{ scale: 1.01 }}` (subtle)
- **Loading skeletons:** Use shadcn `Skeleton` component with pulse animation
- **Widget appear:** Stagger children with `staggerChildren: 0.05`
- **AI chat messages:** Slide in from bottom: `initial={{ opacity: 0, y: 20 }}`
- **Notification badge:** `animate={{ scale: [1, 1.2, 1] }}` on new notification

---

## RESPONSIVE DESIGN

- **Desktop (1280px+):** Full sidebar + content
- **Tablet (768-1279px):** Collapsed sidebar (icons only) + content
- **Mobile (< 768px):** Hidden sidebar, hamburger menu, stacked dashboard widgets

Use Tailwind responsive prefixes: `md:`, `lg:`, `xl:`

---

## INTEGRATION POINTS

| What | Who provides | How you consume it |
|---|---|---|
| Supabase client helpers | Agent 1 | Import from `@/lib/supabase/client` |
| TypeScript types | Agent 1 | Import from `@/types/database` |
| Database (via Supabase) | Agent 1 | Direct Supabase queries in hooks |
| Edge Functions | Agent 1 | `supabase.functions.invoke()` or `invokeFunction()` |
| AI chat streaming | Agent 3 | `invokeFunctionStream('ai-chat', ...)` |
| AI chat message rendering | Agent 3 provides message format | You render markdown + charts + tool results |
| Demo seed data | Agent 1 | You render it — make sure UI looks great with real data |

---

## CRITICAL RULES

1. **Dark mode only** — No light mode toggle needed. Everything is dark theme.
2. **Loading states everywhere** — Every data-fetching component must show skeleton/spinner while loading.
3. **Empty states** — Every list/table must have a beautiful empty state with CTA.
4. **Error boundaries** — Wrap each page section in error boundary. Show friendly error with retry button.
5. **No hardcoded data** — All data comes from Supabase/API. Use TanStack Query for caching.
6. **Canadian formatting** — Currency in CAD (`$142.50 CAD`), dates in Canadian format, bilingual-ready strings.
7. **Accessible** — Use proper ARIA labels, keyboard navigation, focus management.
8. **Performance** — Use `React.memo`, `useMemo`, `useCallback` where appropriate. Virtual scroll for large tables.
9. **shadcn/ui first** — Use shadcn components before building custom. Extend shadcn when needed.
10. **No emoji in production UI** — Use Lucide icons. Emoji only in this spec doc for clarity.

---

## BUILD ORDER (Priority)

1. **Project setup** + tailwind config + globals.css + providers
2. **Auth pages** (login/signup) + middleware
3. **App shell** (sidebar + header layout)
4. **Dashboard page** with KPI widgets + charts (most visual impact)
5. **Pipeline list + builder** pages
6. **Data table** page (critical feature)
7. **AI chat** slide-over panel
8. **Import data** page
9. **Alerts** page
10. **SQL console** page
11. **Settings** page
12. **Polish:** Animations, loading states, empty states, error states
