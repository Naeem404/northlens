# NorthLens — Hack Canada 2026 Pitch

## Enterprise Intelligence for Every Canadian Business

---

## The Problem

**1.2 million small businesses in Canada** make pricing, product, and marketing decisions with almost zero competitive data.

Enterprise competitors use tools costing **$2,300-4,500+/month**:
- Triple Whale ($300-2,000+) for e-commerce analytics
- Prisync/Competera ($200-1,000+) for price monitoring  
- Crayon/Klue ($1,000+) for competitive intelligence
- LightFeed for web data extraction

**Canadian SMBs rely on gut feeling, manual website checks, and outdated spreadsheets.**

---

## The Solution: NorthLens

NorthLens combines **LightFeed's visual data pipelines** with **Triple Whale's analytics command center** in one platform built for Canadian small businesses.

### Extract → Structure → Analyze → Act

**One platform. One price. Built for Canada.**

---

## Live Demo Flow

1. **Type:** "Track winter jacket prices from Canadian Tire, MEC, and Altitude Sports"
2. **AI generates** a schema automatically (Gemini 2.5 Flash)
3. **Pipeline extracts** 28 products, deduplicates, stores in searchable database
4. **Dashboard shows:** Your avg price vs market, price trend chart, competitor changes
5. **AI Advisor:** "Should I match Canadian Tire's price cut?" → Runs SQL, analyzes margins, recommends action
6. **Alerts:** Get notified when competitors drop prices by >10%

**From question to competitive intelligence in under 60 seconds.**

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│  NEXT.JS 15 (App Router)                             │
│  ├── Dashboard (Recharts + react-grid-layout)        │
│  ├── Pipeline Builder (AI Schema Gen)                │
│  ├── Tables (TanStack Table, virtualized)            │
│  ├── SQL Console (Monaco + NLQ via Gemini)           │
│  ├── AI Chat (Gemini 2.5 Pro + Function Calling)     │
│  └── ⌘K Command Palette                             │
│         │ HTTPS                                      │
│         ▼                                            │
│  SUPABASE PLATFORM                                   │
│  ├── Edge Functions (16 Deno functions)              │
│  ├── PostgreSQL + pgvector + RLS                     │
│  ├── Real-time WebSocket                             │
│  ├── Auth (email + OAuth)                            │
│  └── Storage                                         │
│         │                                            │
│  EXTERNAL APIs                                       │
│  ├── Gemini 2.5 Flash (extraction, schema gen)       │
│  ├── Gemini 2.5 Pro (chat, analysis, briefs)         │
│  ├── Open-Meteo (weather context)                    │
│  ├── Exchange Rate API (live CAD/USD)                │
│  └── Backboard.io (persistent AI memory)             │
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Tech | Purpose |
|------|---------|
| **Next.js 15** | App Router, SSR, RSC |
| **shadcn/ui + Radix** | Production UI components |
| **Tailwind CSS 4** | Styling with dark mode |
| **TanStack Table v8** | Virtualized data tables |
| **TanStack Query v5** | Data caching & mutations |
| **Recharts** | Dashboard visualizations |
| **Monaco Editor** | SQL console |
| **Framer Motion** | Animations |
| **cmdk** | Command palette (⌘K) |
| **react-grid-layout** | Drag-and-drop dashboard |
| **react-dropzone** | CSV file upload |
| **PapaParse** | CSV parsing |

### Backend
| Tech | Purpose |
|------|---------|
| **Supabase** | PostgreSQL + Auth + Realtime + Edge Functions |
| **16 Edge Functions** | Pipeline, Query, AI, Data-In endpoints |
| **pgvector** | Semantic search embeddings |
| **RLS Policies** | Row-level security on all tables |
| **12 Database Tables** | Full relational schema |

### AI & Intelligence
| Tech | Purpose |
|------|---------|
| **Gemini 2.5 Flash** | Fast extraction, schema generation |
| **Gemini 2.5 Pro** | Complex analysis, chat, briefs |
| **Function Calling** | AI executes SQL, creates charts, compares data |
| **Backboard.io** | Persistent AI memory across sessions |
| **Canadian Context Engine** | CAD/USD, weather, holidays, seasonality |

---

## Sponsor Track Integration

### Backboard.io ($500 cash)
- AI chat uses Backboard for persistent memory
- Multi-agent orchestration: extraction agent + analysis agent
- Per-user assistants with tool-calling capabilities

### MLH Best Use of Gemini API
- Gemini 2.5 Flash for ALL extraction + schema generation
- Gemini 2.5 Pro for complex analysis + chat + briefs
- Function calling for execute_sql, create_chart, compare_records
- JSON mode for structured extraction output

### Stan — Build in Public ($350/$150)
- Full build journey documented

---

## Key Differentiators

1. **Novel Crossover** — First platform combining web data pipelines + ecommerce analytics
2. **AI That Acts** — Not just shows data, but runs queries, generates charts, recommends actions
3. **Canadian-First** — CAD/USD rates, bilingual, seasonal awareness, Canadian holidays
4. **NL → SQL** — Ask questions in English, get SQL + results instantly
5. **Explainable AI** — Every recommendation includes WHY with specific data references
6. **$49/mo vs $4,500/mo** — Enterprise intelligence at SMB pricing

---

## What We Built in 36 Hours

### Fully Functional Features
- ✅ AI-powered pipeline builder (NL → schema → extraction)
- ✅ Competitive data extraction from any website
- ✅ Dynamic dashboard with live KPIs, charts, change feed
- ✅ High-performance data tables with search, sort, filter, export
- ✅ AI Chat Advisor with function calling (Gemini 2.5 Pro)
- ✅ Natural Language → SQL query engine
- ✅ CSV import with auto-type detection
- ✅ Alert system with conditional triggers
- ✅ SQL Console with Monaco editor
- ✅ ⌘K command palette for power users
- ✅ Live CAD/USD exchange rate
- ✅ Canadian context engine (weather, holidays, seasonality)
- ✅ Full auth with profile management
- ✅ Dark-mode Canadian design system

### Architecture
- ✅ 16 Supabase Edge Functions deployed
- ✅ 12 database tables with RLS
- ✅ 3 pre-seeded demo pipelines (28 records)
- ✅ Demo user with full data set

---

## 30-Day Extension Roadmap

1. **Real Shopify/Square integration** — Pull live product + order data
2. **Automated weekly briefs** — Email delivery of competitive intelligence
3. **French language support** — Quebec market
4. **Team collaboration** — Shared dashboards, role-based access
5. **Slack/Discord alerts** — Real-time notifications
6. **Shopify App Store listing** — Direct distribution

---

## Business Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 3 pipelines, 500 records, basic dashboard |
| **Pro** | $49/mo | Unlimited pipelines, 50K records, AI advisor, alerts |
| **Business** | $149/mo | Team features, API access, custom integrations |

**TAM:** 1.21M Canadian employer businesses × $49/mo = $711M/year

---

## The Close

> "1.2 million Canadian businesses deserve the same data advantage as the enterprise. NorthLens gives it to them."

**NorthLens: Enterprise intelligence for every Canadian business.**
