# NorthLens — Hack Canada 2026 | MVP Build Document
## The Crossover Product: LightFeed × Triple Whale for Canadian SMBs

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision](#3-product-vision)
4. [Feature Breakdown](#4-feature-breakdown)
5. [System Architecture](#5-system-architecture)
6. [Tech Stack](#6-tech-stack)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [UI/UX Specification](#9-uiux-specification)
10. [36-Hour Build Plan](#10-36-hour-build-plan)
11. [Sponsor Track Strategy](#11-sponsor-track-strategy)
12. [Pitch Script](#12-pitch-script-3-minutes)
13. [Q&A Battle Card](#13-qa-battle-card)
14. [Risk Register](#14-risk-register)
15. [30-Day Extension](#15-30-day-extension)
16. [Competitive Analysis](#16-competitive-analysis)
17. [Why This Wins](#17-why-this-wins)

---

## 1. Executive Summary

**Product Name:** NorthLens

**One-Liner:**
> "NorthLens gives small Canadian businesses an AI-powered data command center that extracts competitor intelligence from the open web, unifies it with their own business data, and delivers actionable insights — combining LightFeed's visual data pipelines with Triple Whale's analytics engine in one platform built for Canada."

**What We're Building:**
A web application that merges two best-in-class paradigms:
- **LightFeed's visual data pipeline** — NL web extraction, structured databases, semantic search, value tracking, AI workflows
- **Triple Whale's analytics command center** — unified dashboards, dynamic table building, Data-In/Data-Out APIs, AI querying (Moby-style), activation insights

**Who It's For:**
Small-to-medium Canadian businesses (e-commerce, retail, services) who need enterprise-grade competitive intelligence but can't afford $500+/month per tool.

**The Canadian Angle:**
Canada has 1.21M employer businesses. 97.9% are small (<100 employees). They face:
- Competing against US giants with massive data budgets
- Bilingual market requirements (EN/FR)
- Cross-border pricing pressure (CAD/USD fluctuations)
- Harsh seasonal demand shifts requiring agile pricing
- Evolving Canadian regulatory landscape

---

## 2. Problem Statement

### The Information Asymmetry Crisis

Enterprise businesses use expensive tools to stay competitive:

| Tool | Purpose | Monthly Cost |
|---|---|---|
| Triple Whale | E-commerce analytics, attribution, AI | $300-2,000+ |
| Similarweb | Competitive traffic analysis | $500+ |
| SEMrush/Ahrefs | SEO & competitor keywords | $300+ |
| Prisync/Competera | Competitor price monitoring | $200-1,000+ |
| Crayon/Klue | Competitive intelligence | $1,000+ |

**Total to match enterprise intelligence: $2,300-4,500+/month**

Canadian SMBs rely on gut feeling, manual website checks, and outdated spreadsheets.

### Why Existing Solutions Fail Canadian SMBs
1. **Too expensive** — Enterprise pricing for enterprise budgets
2. **Too complex** — Require data teams to set up
3. **Not Canada-aware** — No CAD/USD, no bilingual, no Canadian regulatory tracking
4. **Fragmented** — Need 5+ tools for a complete picture
5. **No action layer** — Show data but don't tell you what to DO

### The Opportunity
The web is an open database. Competitor prices, catalogs, reviews, sentiment — it's all public. The problem isn't data scarcity — it's data accessibility.

**LightFeed proved** AI can turn any website into structured data with a prompt.
**Triple Whale proved** unified analytics with AI insights changes how businesses decide.
**NorthLens combines both.** Extract → Structure → Analyze → Act. One platform. Built for Canada.

---

## 3. Product Vision

### Three Pillars

**Pillar 1: Pipeline Engine (LightFeed-Inspired)**
How data enters NorthLens. Users describe what they need in plain English.

| LightFeed Feature | NorthLens Implementation |
|---|---|
| NL prompts for extraction | Pipeline Builder with prompt-to-schema |
| AI agent navigation | Headless browser + LLM-guided extraction |
| Semantic search (embeddings) | pgvector in Supabase |
| Value history tracking | Versioned records with change detection |
| List Mode vs Detail Mode | Auto-detection + user override |
| Email notifications | In-app + email + webhook alerts |
| API (Get/Search/Filter) | Full REST API for all pipeline data |
| OSS extractor (@lightfeed/extractor) | Direct integration |

**Pillar 2: Command Center (Triple Whale-Inspired)**
Where users visualize, analyze, and understand data.

| Triple Whale Feature | NorthLens Implementation |
|---|---|
| Summary Page | Customizable KPI dashboard with widgets |
| Data-In API | REST API + CSV + Shopify/Square connectors |
| Data-Out API | Full read API for all stored data |
| Moby AI (NL → insights) | AI Assistant with business context |
| Custom SQL Query | SQL console with autocomplete |
| Custom BI | Chart builder with multiple chart types |
| Sonar (enrichment) | Pipeline enrichment workflows |
| 60+ integrations | Modular connector architecture |
| Context Engine | Business profile powering all AI |
| Data Warehouse Export | Export to CSV/BigQuery/Snowflake |

**Pillar 3: Intelligence Layer (The Crossover Moat)**
Where LightFeed stops at extraction and Triple Whale stops at analytics, NorthLens combines both.

- **Competitive Position Score** — Real-time 0-100 score vs tracked competitors
- **AI Business Advisor** — Context-aware AI that knows your data AND your market
- **Anomaly Detection** — Auto alerts on competitor price drops, new products, review spikes
- **Opportunity Radar** — AI identifies market gaps
- **Automated Competitive Briefs** — Weekly AI reports
- **Canadian Context Engine** — CAD/USD rates, Canadian holidays, provincial regs, bilingual dynamics

---

## 4. Feature Breakdown

### 4.1 Pipeline Builder (`/pipelines`)
1. User types NL prompt: "Track men's winter jacket prices from canadiantire.ca"
2. Gemini generates schema: `{ name, price, rating, url, availability }`
3. User edits/confirms schema
4. System runs first extraction, shows preview
5. Pipeline saved and scheduled (hourly/daily/weekly)

**Premium capabilities:** Multi-page extraction, subpage drilling, cross-source enrichment, smart scheduling, proxy rotation, change detection with visual diffs.

### 4.2 Data Tables (`/tables`)
High-performance virtualized tables (100K+ rows via TanStack Table):
- Drag columns to reorder/resize/hide
- Multi-column sort, complex filters
- Group by any column with aggregations
- Inline formula columns (`price_diff = competitor_price - my_price`)
- Change indicators (↑↓ arrows with % change since last extraction)
- Conditional formatting, saved views, pivot tables
- Export to CSV/Google Sheets/API

### 4.3 Dashboard (`/dashboard`)
Customizable widget grid (react-grid-layout):

| Widget | Visualization |
|---|---|
| KPI Card | Number + sparkline + trend |
| Price Tracker | Multi-line chart over time |
| Market Position | Radar chart |
| Competitor Grid | Mini comparison table |
| Anomaly Feed | Activity timeline |
| Opportunity Card | AI insight with CTA |
| Change Log | Timeline of detected changes |

### 4.4 AI Assistant (Slide-over panel)
Moby-style AI with function calling:
- NL querying → auto-generates SQL → returns data + chart
- Contextual recommendations based on business profile + market data
- Report generation (weekly competitive briefs)
- Pipeline suggestions
- Tools: `execute_sql`, `search_records`, `create_chart`, `get_price_history`, `compare_records`, `trigger_pipeline`, `create_alert`

### 4.5 Data-In (`/import`)
- CSV upload with auto column mapping
- Shopify OAuth connector
- Google Sheets live sync
- REST API ingestion
- Manual entry

### 4.6 Alerts (`/alerts`)
- Price change, new product, stock change, anomaly, regulatory alerts
- Delivery: in-app, email digest, webhook (Slack/Discord)

---

## 5. System Architecture

### High-Level

```
CLIENT (Next.js 15 App Router)
  ├── Pipeline Builder (NL → schema → extraction)
  ├── Tables (TanStack Table, virtualized, 100K+ rows)
  ├── Dashboard (react-grid-layout widgets + Recharts)
  ├── AI Chat (streaming SSE + function calling)
  └── Settings & Auth
         │
         │ HTTPS / WSS
         ▼
SUPABASE PLATFORM
  ├── Edge Functions (Deno/TypeScript)
  │     ├── /api/pipeline/* (create, run, schedule, preview)
  │     ├── /api/query/*   (records, sql, nlq, summary, compare)
  │     ├── /api/ai/*      (chat stream, brief, anomalies)
  │     └── /api/data-in/* (csv, shopify, api, manual)
  │
  ├── Shared Services
  │     ├── Extraction Service (@lightfeed/extractor + Gemini)
  │     ├── AI Engine (Gemini 2.5 Flash/Pro + function calling)
  │     └── Scheduler (pg_cron for pipeline refresh + alert checks)
  │
  ├── PostgreSQL + pgvector
  │     ├── profiles, pipelines, records, record_versions
  │     ├── data_imports, import_records
  │     ├── dashboards, widgets, alerts, alert_events
  │     ├── ai_chats, saved_queries
  │     └── Indexes: GIN on JSONB, ivfflat on embeddings
  │
  ├── Realtime (WebSocket)
  │     └── Pipeline status, new records, alerts, widget updates
  │
  ├── Auth (+ Auth0 for MLH track)
  │     └── Email/password + Google OAuth + RLS on all tables
  │
  └── Storage (CSV uploads, report PDFs, HTML snapshots)

EXTERNAL APIs:
  ├── LightFeed API (premium extraction fallback)
  ├── Gemini 2.5 Flash (fast extraction + schema gen)
  ├── Gemini 2.5 Pro (complex analysis + briefs)
  ├── Open-Meteo (seasonal weather context)
  └── Exchange Rate API (CAD/USD)
```

### Extraction Pipeline Flow

```
User Prompt
  → Schema Generation (Gemini 2.5 Flash)
    → URL Resolution + Pagination Detection
      → HTML Acquisition (fetch or headless browser)
        → Content Cleaning (HTML → Markdown)
          → LLM Extraction (@lightfeed/extractor + Gemini)
            → JSON Sanitization + URL Validation
              → Deduplication (content hash)
                → Change Detection (field-level diff)
                  → Version Storage
                    → Embedding Generation (pgvector)
                      → Alert Condition Evaluation
                        → Dashboard Metric Recalculation
```

### AI Assistant Architecture

The AI has a **Context Engine** injected into every conversation:
1. **Business Profile** — Name, industry, location, goals, product categories
2. **Pipeline Metadata** — Active pipelines, schemas, record counts, last runs
3. **Recent Data Summaries** — Key metrics from last 7 days, notable changes
4. **Canadian Context** — Current CAD/USD rate, season, upcoming holidays, weather

**Function Calling:** The AI can execute SQL, search records, create charts, fetch price history, compare records, trigger pipelines, and create alerts — all mid-conversation.

---

## 6. Tech Stack

### Frontend
| Component | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, RSC, API routes |
| UI | shadcn/ui + Radix UI | Production components, accessible |
| Styling | Tailwind CSS 4 | Rapid prototyping, dark mode |
| Charts | Recharts | React-native, composable, SSR |
| Tables | TanStack Table v8 | Headless, virtualized, 100K+ rows |
| State | TanStack Query v5 | Caching, optimistic updates |
| Icons | Lucide React | Clean, tree-shakeable |
| Forms | React Hook Form + Zod | Type-safe validation |
| Layout | react-grid-layout | Dashboard drag-and-drop |
| Code Editor | Monaco Editor | SQL console |
| Animation | Framer Motion | Smooth transitions |

### Backend
| Component | Technology | Why |
|---|---|---|
| Platform | Supabase | PG + Auth + Realtime + Storage + Edge Fns |
| Edge Functions | Deno (TypeScript) | Zero cold start, native fetch |
| Database | PostgreSQL 15 | JSONB, pgvector, PostgREST |
| Vector Search | pgvector | Semantic search, no extra infra |
| Auth | Supabase Auth (+Auth0) | Email + OAuth + RLS |
| Cron | pg_cron | Scheduled pipeline runs |

### AI & Extraction
| Component | Technology | Why |
|---|---|---|
| Extraction | @lightfeed/extractor (OSS) | Production-proven, JSON sanitization |
| LLM (Fast) | Gemini 2.5 Flash | Schema gen, extraction, quick queries |
| LLM (Smart) | Gemini 2.5 Pro | Complex analysis, briefs, strategy |
| Embeddings | Gemini text-embedding | Semantic search vectors |
| HTML Render | Puppeteer (Browserless.io) | JS-rendered pages, infinite scroll |

---

## 7. Database Schema

See `schema.sql` (separate file) for full implementation. Key tables:

- **profiles** — Extended user profiles with business context (JSONB)
- **pipelines** — Extraction configs: prompt, schema, sources[], schedule, status
- **records** — Extracted data (JSONB), content_hash, embedding (vector), version tracking
- **record_versions** — Change history: old_data, new_data, changed_fields[], change_summary
- **data_imports / import_records** — User's own business data
- **dashboards / widgets** — Dashboard layout + widget configs
- **alerts / alert_events** — Alert conditions + trigger history
- **ai_chats** — Conversation history with context snapshots
- **saved_queries** — Named SQL queries with visualization configs

All tables have RLS policies (users access only their own data).
Indexes: GIN on JSONB, ivfflat on embeddings, composite on pipeline_id + is_latest.

---

## 8. API Design

### Pipeline Endpoints
```
POST /api/pipeline/create     → { prompt, sources[], schedule } → creates + runs
POST /api/pipeline/:id/run    → triggers immediate extraction
GET  /api/pipeline/:id/status → { status, record_count, last_run }
PUT  /api/pipeline/:id        → update config
POST /api/pipeline/preview    → one-off extraction preview (no storage)
```

### Query Endpoints (Triple Whale Data-Out Inspired)
```
POST /api/query/records  → { pipeline_id, filters, sort, search, pagination }
POST /api/query/sql      → { sql } → executes safe SQL
POST /api/query/nlq      → { question } → AI generates SQL → executes → formats
GET  /api/query/summary  → { metrics, changes, anomalies }
POST /api/query/compare  → { record_ids[], fields[] } → side-by-side
GET  /api/query/history  → { versions[], change_timeline }
```

### AI Endpoints
```
POST /api/ai/chat     → streaming SSE with function calling
POST /api/ai/brief    → competitive intelligence report
POST /api/ai/anomalies → anomaly detection analysis
```

### Data-In Endpoints (Triple Whale Data-In Inspired)
```
POST /api/data-in/csv         → auto-detect columns, suggest mapping
POST /api/data-in/csv/confirm → finalize import
POST /api/data-in/manual      → add records directly
POST /api/data-in/api         → REST ingestion
```

---

## 9. UI/UX Specification

### Design System
```
Background:       #0A0A0F (deep navy)
Surface:          #141420 (cards)
Border:           #2A2A3E
Text Primary:     #F0F0F5
Text Secondary:   #8888A0
Accent Primary:   #E63946 (Canadian red)
Accent Secondary: #457B9D (Canadian blue)
Success/Up:       #2ECC71
Danger/Down:      #E74C3C
Warning:          #F39C12
Font: Inter (body), JetBrains Mono (code)
Radius: 8px cards, 6px inputs, 4px badges
```

### Key Screens

**Dashboard** — KPI cards (your avg price, market avg, position rank), price tracker line chart, recent changes feed, opportunity radar card, AI insight banner with action buttons.

**Pipeline Builder** — NL prompt textarea, auto-generated schema table (editable), source URL list, schedule selector, preview table with extracted data.

**Data Table** — Full-width virtualized table with filter bar, sort indicators, change arrows (↑↓ with color), column drag, group-by, export buttons.

**AI Chat** — Slide-over panel with streaming messages, inline SQL blocks, embedded charts, action buttons for recommendations.

---

## 10. 36-Hour Build Plan

### Phase 1: Foundation (Hours 0-6)

**Hour 0-1: Project Setup**
- Next.js 15 project with App Router, Tailwind, shadcn/ui
- Supabase project creation, schema migration
- Environment variables, GitHub repo setup

**Hour 1-3: Auth + Core Layout**
- Supabase Auth (email/password + Google OAuth)
- App shell: sidebar navigation, header, responsive layout
- Profile setup / onboarding flow (business name, type, location)

**Hour 3-6: Pipeline Engine (Backend)**
- Edge Function: `/api/pipeline/create` — prompt → Gemini schema generation
- Edge Function: `/api/pipeline/preview` — URL → HTML → @lightfeed/extractor → records
- Edge Function: `/api/pipeline/:id/run` — full extraction with dedup + versioning
- Seed one demo pipeline: "Track winter jacket prices from canadiantire.ca"

### Phase 2: Core Features (Hours 6-14)

**Hour 6-8: Pipeline Builder UI**
- NL prompt input with placeholder examples
- Schema preview table (editable)
- Source URL management
- Preview extraction results
- Save & schedule

**Hour 8-11: Data Table**
- TanStack Table integration with server-side pagination
- Sort, filter, search
- Change indicators (↑↓ arrows, color coding)
- Column configuration (reorder, hide, resize)
- Export to CSV

**Hour 11-14: Dashboard**
- react-grid-layout with drag-and-drop widgets
- KPI card widget (metric + trend + sparkline)
- Line chart widget (price trends via Recharts)
- Recent changes feed widget
- Widget configuration modals

### Phase 3: Intelligence (Hours 14-22)

**Hour 14-17: AI Assistant**
- Chat UI (slide-over panel, streaming SSE)
- Gemini integration with business context injection
- Function calling: execute_sql, search_records
- Inline chart rendering from AI responses

**Hour 17-19: Change Detection & Alerts**
- Record versioning on re-extraction
- Change detection with field-level diffs
- Visual change indicators in tables
- Alert creation UI + in-app notification center

**Hour 19-22: Data-In + Polish**
- CSV upload with auto-mapping
- Manual data entry
- Comparison view (your data vs competitor data)
- Canadian context: CAD/USD widget, seasonal indicators

### Phase 4: Demo & Submission (Hours 22-30)

**Hour 22-25: Demo Flow**
- Seed realistic Canadian business demo data
- Pre-built pipeline: 3 competitors, winter jackets, tracked over "2 weeks"
- Pre-built dashboard with all widget types populated
- AI chat demo showing NL query → SQL → chart → recommendation

**Hour 25-28: Polish**
- Loading states, error handling, empty states
- Animations (Framer Motion page transitions)
- Responsive design pass
- Performance optimization (virtualized tables, lazy loading)

**Hour 28-30: Submission**
- README with architecture diagram, screenshots, setup instructions
- Demo video (screen recording of full flow)
- Devpost submission with all required materials
- GitHub repo cleanup, environment variable documentation

### Phase 5: Pitch Prep (Hours 30-34)

**Hour 30-32: Pitch Deck**
- Narrative arc: Problem → Solution → Demo → Business model → Ask
- Architecture diagram (simplified for judges)
- Key metrics / validation points

**Hour 32-34: Practice**
- 3-minute delivery rehearsal (x5)
- Q&A preparation (see Section 13)
- Demo backup plan (screenshots if internet fails)

---

## 11. Sponsor Track Strategy

### Primary Target: Main Track (1st/2nd/3rd Place)
- Technical Execution (40%): Multi-layered architecture, real AI extraction, real-time data, pgvector
- Innovation (25%): Novel crossover of two established product categories
- Design/UX (20%): Dark-mode dashboard, Canadian design language
- Presentation (15%): Strong Canadian problem narrative

### Secondary Targets

**Backboard.io ($500 cash)** — Use Backboard's AI for the intelligence layer. Multi-agent orchestration: one agent for extraction, one for analysis, one for recommendations. Leverages their memory and model-swapping features.

**MLH Best Use of Gemini API (Google Swag)** — Gemini 2.5 Flash for all extraction + schema generation. Gemini 2.5 Pro for complex analysis. Prominent in the demo and README.

**MLH Best Use of Auth0 (Headphones)** — Auth0 for authentication with social sign-in (Google, LinkedIn). MFA for business accounts. Straightforward integration.

**MLH Best Use of Vultr (Portable Screens)** — Host the extraction engine on Vultr cloud compute. Use Vultr for headless browser rendering. Mention cloud credits in demo.

**Stan — Build in Public ($350/$150)** — Document the entire build journey on LinkedIn. Use Stanley for posts. Tag @Stanley. Minimum 3 posts Friday→Saturday.

### Track Integration Architecture
```
Auth0 → Authentication layer
Gemini → AI extraction + analysis + chat
Backboard → Memory + multi-agent orchestration for AI advisor
Vultr → Cloud compute for extraction workers
Supabase → Core platform
```

---

## 12. Pitch Script (3 Minutes)

### Opening Hook (15s)
"There are 1.2 million small businesses in Canada. 97% of them are making pricing decisions, product decisions, and marketing decisions with almost zero competitive data. Not because the data doesn't exist — it does. It's on the open web. They just can't access it."

### Problem (30s)
"Enterprise competitors use tools like Triple Whale for analytics and platforms like LightFeed for data extraction. Together, that's $2,000 to $5,000 a month. A small shop in Waterloo selling winter jackets has to manually check Canadian Tire's website and update a spreadsheet. By the time they react to a competitor price drop, they've already lost the sale."

### Solution (45s)
"NorthLens combines the best of both worlds. We took LightFeed's approach to turning any website into structured data, and Triple Whale's approach to unified analytics with AI, and we built a single platform designed for Canadian small businesses."

[LIVE DEMO — 60s]
"Watch. I type: 'Track winter jacket prices from Canadian Tire, MEC, and Altitude Sports.' NorthLens generates a schema, extracts 28 products, deduplicates them, and stores them in a searchable database. Now I see a dashboard: my average price versus the market, a price trend chart, and an alert that Canadian Tire just dropped their parka by 15%.

I open our AI advisor and ask: 'Should I match this price cut?' It runs a query against my data and my competitors', factors in my margins and the current CAD/USD rate, and tells me: 'Hold your price. You're positioned as premium. Instead, emphasize your waterproof rating and free shipping. Here's a comparison chart you can use.'

That's competitive intelligence that used to require a data team. Now it takes 30 seconds."

### Differentiator (20s)
"NorthLens is the first platform that combines web data pipelines with ecommerce analytics for Canadian SMBs. Pipeline extraction like LightFeed. Analytics like Triple Whale. AI that knows both your business and your market. One price. Built for Canada."

### Close (10s)
"1.2 million Canadian businesses deserve the same data advantage as the enterprise. NorthLens gives it to them. Questions?"

---

## 13. Q&A Battle Card

**Q: How is this different from just using ChatGPT to analyze competitor websites?**
A: ChatGPT gives you a snapshot. NorthLens gives you a pipeline — automated, scheduled, versioned, with change detection and historical trends. Plus it stores everything in a queryable database you can build dashboards on.

**Q: Can you actually extract data from any website?**
A: We use @lightfeed/extractor (open-source, 10M+ records in production) with Gemini for LLM extraction. It handles most sites. For highly dynamic JS apps, we use headless rendering. We're honest about edge cases — some sites block extraction, and we respect robots.txt.

**Q: What about legal/ethical concerns with web scraping?**
A: We extract publicly available data, similar to how Google indexes the web. We respect robots.txt, rate-limit requests, and don't circumvent paywalls. This is the same approach used by price comparison engines, which are legal and established.

**Q: How do you handle scale?**
A: PostgreSQL with JSONB handles flexible schemas. pgvector handles semantic search. TanStack Table virtualizes 100K+ rows client-side. Supabase Edge Functions auto-scale. For the hackathon demo we show ~100 records; the architecture supports millions.

**Q: What's the business model?**
A: Freemium SaaS. Free tier: 3 pipelines, 500 records, basic dashboard. Pro ($49/mo): unlimited pipelines, 50K records, AI advisor, alerts. Business ($149/mo): team features, API access, custom integrations.

**Q: Why Canada-specific?**
A: Canada has unique market dynamics: bilingual requirements, cross-border USD competition, extreme seasonal shifts, specific regulatory environment. Building for Canada first gives us a focused GTM and a regulatory moat. We expand to US/global after.

**Q: What would you build in the 30-day extension?**
A: Real Shopify/Square integrations, Slack/Discord alert delivery, French language support, team collaboration, and a Shopify app store listing.

---

## 14. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM extraction accuracy < 80% | Medium | High | Use @lightfeed/extractor (production-proven), test on target sites early, have manually seeded fallback data |
| Gemini API rate limits during demo | Low | Critical | Pre-cache demo extraction results, have screenshots as backup |
| Supabase free tier limits hit | Medium | Medium | Use a single project efficiently, pre-seed demo data to reduce live API calls |
| Table performance with large datasets | Low | Medium | TanStack Virtual handles 100K+ rows, server-side pagination, lazy loading |
| Another team builds similar concept | Low | Medium | Our differentiator is the crossover — no one else combines extraction + analytics + AI |
| Auth0 integration complexity | Medium | Low | Fallback to Supabase Auth only (still functional, just lose MLH track) |
| Internet issues during demo | Medium | High | Pre-record demo video, have screenshots, pre-cache all demo data locally |
| Scope creep kills core features | High | Critical | Strict phase gates: core features (P1/P2) MUST work before intelligence layer (P3) |

---

## 15. 30-Day Extension

### Week 1: Production Hardening
- Real Shopify OAuth integration (pull products, orders, customers)
- Square POS connector for brick-and-mortar businesses
- Pipeline scheduling via Supabase pg_cron (production-grade)

### Week 2: Advanced Intelligence
- Automated weekly competitive briefs (email delivery)
- French language support for Quebec market
- Advanced anomaly detection (statistical, not just threshold-based)
- Price optimization recommendations with margin-aware modeling

### Week 3: Collaboration & Growth
- Team workspaces (invite team members, shared dashboards)
- Role-based access control (admin, analyst, viewer)
- Slack/Discord integration for alerts
- Public API for third-party integrations

### Week 4: GTM & Launch
- Shopify App Store listing
- Landing page + waitlist
- 5 pilot customers (small Canadian e-commerce businesses)
- Investor pitch deck for seed funding

---

## 16. Competitive Analysis

| Product | What It Does | Gap NorthLens Fills |
|---|---|---|
| LightFeed | Web extraction pipelines | No analytics layer, no business data integration |
| Triple Whale | E-commerce analytics + AI | No competitive data extraction, requires Shopify |
| Prisync | Price monitoring | No AI insights, no custom schemas, expensive |
| Crayon | Enterprise competitive intel | $1000+/mo, enterprise-only, no SMB play |
| SEMrush | SEO competitive analysis | SEO-focused, no price/product tracking |
| Google Alerts | Basic web monitoring | No structured data, no analytics, no AI |
| ChatGPT | Ad-hoc analysis | No persistence, no pipelines, no dashboards |

**NorthLens Unique Position:** The only platform that combines automated web data extraction with unified analytics, powered by AI that understands both your business and your competitive landscape. Purpose-built for Canadian SMBs at an affordable price point.

---

## 17. Why This Wins

### Technical Execution (40% of score)
- **Multi-layered architecture:** Next.js + Supabase + Edge Functions + pgvector + LLM extraction
- **Real AI, not just a wrapper:** Function-calling AI assistant that executes SQL, generates charts, analyzes trends
- **Open-source backbone:** @lightfeed/extractor (10M+ records in production)
- **Real-time:** Supabase Realtime for live dashboard updates and pipeline status
- **Performance:** Virtualized tables, streaming AI, edge functions

### Innovation & Creativity (25%)
- **Novel crossover:** No one else has combined web data pipelines with ecommerce analytics
- **Canadian-first design:** CAD/USD, bilingual, seasonal, regulatory awareness baked in
- **Democratization narrative:** Enterprise intelligence for SMBs at $49/mo
- **The "why" behind every insight:** AI doesn't just show data — it explains and recommends

### Design & User Experience (20%)
- **Dark-mode Canadian aesthetic:** Red + blue accent colors, clean typography
- **Progressive disclosure:** Simple NL prompt → advanced schema editing → expert SQL console
- **Dashboard as daily driver:** Judges will see this as a product people would actually use
- **Micro-interactions:** Framer Motion animations, loading states, change indicators

### Presentation & Communication (15%)
- **Visceral Canadian problem:** Every judge in Waterloo understands competing against US giants
- **Live demo, not slides:** Real extraction, real AI, real insights
- **Clear narrative arc:** Problem → Insight → Product → Demo → Vision
- **Memorable one-liner:** "Enterprise intelligence for every Canadian business"

---

## Appendix A: Demo Seed Data

For the demo, pre-seed the following:

**Business Profile:** "Northern Outfitters" — Small e-commerce store in Waterloo selling winter outdoor gear.

**Pipeline 1:** "Winter Jacket Prices" — 28 products tracked from Canadian Tire, MEC, Altitude Sports.
**Pipeline 2:** "Competitor Reviews" — Review scores and sentiment from Google, Trustpilot.
**Pipeline 3:** "Industry News" — Canadian retail news from Retail Council of Canada, BNN Bloomberg.

**Own Data Import:** CSV of 15 products from "Northern Outfitters" with price, cost, margin, inventory.

**Pre-built Dashboard:** 6 widgets (KPI cards, price tracker, changes feed, opportunity card, competitor grid, AI insight).

**AI Chat Demo Script:**
1. "What's my average price compared to the market?"
2. "Canadian Tire just dropped their parka by 15%. Should I match?"
3. "Show me products where I have the largest margin advantage"
4. "Generate a competitive brief for this week"

---

## Appendix B: Key Prompts

### Schema Generation Prompt
```
You are a data schema generator. Given a user's natural language description
of what data they want to extract from websites, generate a JSON schema.

User prompt: "{user_prompt}"

Generate a schema as a JSON array of fields, each with:
- name: camelCase field name
- type: "string" | "number" | "boolean" | "url" | "date"
- description: What this field captures

Include a "source_url" field automatically. Return valid JSON only.
```

### Extraction Prompt (via @lightfeed/extractor)
```
Extract structured data from this webpage content according to the schema.
This is a {mode} extraction (list = multiple items, detail = single item).

Schema: {schema_json}

Rules:
- Extract ALL matching items on the page
- Prices must be numeric (remove $ and currency symbols)
- URLs must be absolute (resolve relative URLs using base: {source_url})
- If a field is not found, use null
- Be thorough — do not skip items

Return a JSON array of objects matching the schema.
```

### AI Advisor System Prompt
```
You are NorthLens AI, a competitive intelligence advisor for Canadian
small businesses. You have access to the user's business data and
their tracked competitive data.

Business Context:
{business_profile}

Active Pipelines:
{pipeline_summaries}

Recent Data:
{recent_metrics_summary}

Canadian Context:
- CAD/USD: {exchange_rate}
- Season: {current_season}
- Upcoming: {next_canadian_holiday}

You can call these functions:
- execute_sql(query) — Run SQL against the user's data
- search_records(pipeline_id, query) — Semantic search
- create_chart(type, data, config) — Generate inline chart
- get_price_history(record_id, field) — Historical values

Always be specific. Reference actual data. Recommend actions, not just
observations. When comparing prices, use CAD. Consider seasonality.
```
