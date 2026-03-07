# FrostFind — Hack Canada 2026 | Reactiv ClipKit Build Document

## Table of Contents
1. [Research Synthesis](#1-research-synthesis)
2. [Product Concept (Refined)](#2-product-concept-refined)
3. [Heavy Criticism of the Original Idea](#3-heavy-criticism-of-the-original-idea)
4. [Heavy Criticism of the Refined Idea](#4-heavy-criticism-of-the-refined-idea)
5. [Final Concept After All Critiques](#5-final-concept-after-all-critiques)
6. [Technical Architecture](#6-technical-architecture)
7. [Frameworks & Stack](#7-frameworks--stack)
8. [Step-by-Step Build Plan](#8-step-by-step-build-plan)
9. [Pitch Script (3 min)](#9-pitch-script-3-min)
10. [Risk Register](#10-risk-register)

---

## 1. Research Synthesis

### What Reactiv Actually Wants
From the ClipKit Lab GitHub repo and Devpost:
- **One focused App Clip moment**, URL-invoked, ephemeral, value in **under 30 seconds**
- The judging question: *"What experience fits the shape of an App Clip that nobody has thought of?"*
- **Novelty > polish**. They want creative problem framing, not another coupon app.
- They explicitly list 4 problem statements: AI Personalization, In-Store Companion, Ad-to-Clip Commerce, Live Events
- **iOS only**, Swift/SwiftUI, **no external dependencies** (no SPM, CocoaPods, Carthage)
- Xcode 26+, Swift 5.0, iOS 26+ simulator
- Submit via PR to their repo with screen recordings
- Reactiv integrates with Shopify (catalog, cart, checkout) + push notifications (up to 8 hours)

### Hack Canada Overall Judging (separate from Reactiv track)
| Criteria | Weight |
|---|---|
| Technical Execution | 40% |
| Innovation & Creativity | 25% |
| Design & UX | 20% |
| Presentation & Communication | 15% |

### Competitive Landscape — AI Shopping Assistants
- **Insider One**: Enterprise CDP + agentic shopping assistant, $$$$ pricing, Adidas/Lexus tier
- **Perplexity Shopping**: Search-based, no merchant integration
- **Alby**: Shopify-focused AI assistant, but requires full app install
- **ChatGPT Shopping**: Broad, not merchant-specific
- **Agentforce (Salesforce)**: Enterprise-only, multi-agent orchestration

**Gap identified**: No one does AI-powered product discovery as a **zero-install, ephemeral, context-aware moment** triggered from a physical or digital touchpoint. Every competitor requires either an app install, account creation, or browsing history. App Clips have NONE of that.

### Cold Start Personalization (Zero-History Problem)
Research shows effective approaches for zero-history users:
- **Contextual signals**: time of day, weather, location, device locale, URL parameters
- **Intent-first interaction**: Instead of asking users to browse, ask them ONE question about their intent
- **Session-level behavioral signals**: Even within a 30-second session, taps and scroll patterns reveal preference
- **Preset intent chips**: Offer 3-4 high-probability intents based on context, user taps one

### App Clip Technical Constraints
- **50MB max** (digital invocation), **15MB max** (physical NFC/QR)
- No background processing, limited storage
- Can use: URLSession, CoreLocation, MapKit, AVFoundation, CoreNFC
- Cannot use: Push notifications without ephemeral token, CallKit, certain HealthKit APIs
- **Ephemeral notification token** available for up to 8 hours after interaction (this is what Reactiv uses)

---

## 2. Product Concept (Refined)

### Name: **FrostFind**

### One-Line Pitch
> "FrostFind gives small Canadian merchants an AI-powered App Clip that helps shoppers find the right product in under 15 seconds — using weather, location, and one tap of intent — with zero install, zero login, and zero browsing history."

### The Moment
A shopper is standing outside in -15°C weather in Waterloo. They see a QR code on a local outerwear shop's window (or tap an Instagram ad). A Clip opens instantly. It already knows:
- It's -15°C and snowing
- They're in Waterloo, ON
- It's 7:45 PM (evening shopping)
- The URL tells us this is a winter outerwear store

Instead of a product grid, they see:

```
┌─────────────────────────────────────┐
│  ❄️ -15°C in Waterloo right now     │
│                                      │
│  What are you looking for?           │
│                                      │
│  ┌─────────┐  ┌──────────────┐      │
│  │ 🧥 Warm  │  │ 🎁 Gift idea │      │
│  │ jacket   │  │  under $100  │      │
│  └─────────┘  └──────────────┘      │
│  ┌─────────┐  ┌──────────────┐      │
│  │ 🧤 Cold  │  │ 🔍 Just      │      │
│  │ commute  │  │  browsing    │      │
│  └─────────┘  └──────────────┘      │
└─────────────────────────────────────┘
```

They tap "Warm jacket". AI instantly returns 3 ranked products:

```
┌─────────────────────────────────────┐
│  Top picks for warmth in Waterloo   │
│                                      │
│  1. Arctic Explorer Parka — $189    │
│     "Rated to -30°C. Waterproof.    │
│      Best for your conditions."     │
│     ⭐ Best Match                   │
│                                      │
│  2. Urban Thermal Coat — $149       │
│     "Warm to -20°C. Slimmer fit.    │
│      Good for commuting."           │
│                                      │
│  3. Fleece-Lined Shell — $99        │
│     "Layering piece. Windproof.     │
│      Budget-friendly option."       │
│                                      │
│  🧤 Add matching gloves? +$29      │
│                                      │
│  [ Add to Cart → Checkout ]         │
└─────────────────────────────────────┘
```

Each recommendation includes a **one-line "why this"** reason tied to the user's actual context (weather, use case, budget). The AI doesn't just rank by popularity — it explains why THIS product fits THIS moment.

### Why This is Different from Every Other AI Shopping Assistant
1. **Zero-install, zero-history** — Solves the cold start problem using only ambient context
2. **Explains WHY** — Not just "recommended for you" but "rated to -30°C, best for your conditions"
3. **Merchant-side value** — Small shops can't afford Insider One ($50K+/year) or build custom recommendation engines
4. **Under 15 seconds to value** — Tap QR → see context → tap intent → see ranked products → checkout
5. **Canadian-specific** — Weather-driven commerce is uniquely powerful in Canadian winters

### Invocation Sources
- QR code on shop window / in-store display
- Instagram/Facebook ad link
- SMS/email campaign URL
- Safari Smart App Banner
- NFC tag on physical products

---

## 3. Heavy Criticism of the Original Idea

The original idea from the Discord conversation had these problems:

### Problem 1: "Scrape information from any website" is a liability
- Web scraping is legally gray (violates most sites' ToS)
- It's technically unreliable (sites change structure constantly)
- It's too broad — judges will ask "scrape WHAT exactly?" and you won't have a tight answer
- It screams "I built a tool, not a product"

### Problem 2: "Chatbot" is the most overused word in hackathons
- Every single team at every hackathon since 2023 has said "we built an AI chatbot"
- Judges are fatigued. The word triggers eye-rolls.
- A chatbot implies back-and-forth conversation — that's 60+ seconds minimum, killing the 30-second App Clip constraint

### Problem 3: "Platform for multiple use cases" is anti-App Clip
- App Clips are ONE moment. Not a platform. Not multi-tab. Not multi-feature.
- Reactiv's own docs say: "Not a full app. Not multiple tabs. One clear moment."
- Pitching a platform tells judges you didn't understand the constraint

### Problem 4: "Visual database" is infrastructure, not product
- Judges don't care about your database schema
- They care about what the USER sees and feels
- Leading with infra is a startup pitch mistake at a hackathon

### Problem 5: No clear invocation trigger
- The original idea never answered: HOW does the user open this?
- App Clips MUST be URL-invoked. If you can't describe the physical/digital trigger, you don't have an App Clip idea

### Problem 6: No clear checkout or conversion path
- Reactiv is a COMMERCE platform. They want to see commerce moments.
- "Create information through forms of data" has no revenue model visible to judges

---

## 4. Heavy Criticism of the Refined Idea (FrostFind)

Now let's tear apart FrostFind itself:

### Criticism 1: Weather-based personalization is obvious
- The Reactiv problem statement LITERALLY says "time, location, weather, URL parameters"
- Every team reading that doc will think "let me use weather for recommendations"
- This is table stakes, not innovation
- **Counter-argument**: The innovation isn't USING weather — it's the INTERACTION PATTERN. Most teams will build a weather-aware product grid. We're building intent-first chips that adapt to weather. The difference is the UX, not the data source.

### Criticism 2: You can't actually connect to a real Shopify store
- You don't have Shopify API credentials for a real merchant
- Your "checkout" will be simulated
- Judges will see through a fake checkout flow
- **Counter-argument**: Reactiv explicitly says "Reasonable assumptions are allowed where integrations are unavailable." We mock the product catalog with realistic Canadian outerwear data and demonstrate the FLOW. The Shopify integration is the 30-day extension story.

### Criticism 3: The AI recommendation engine is just GPT with a prompt
- Under the hood, you're calling OpenAI's API with product data + weather + location
- That's not a "recommendation engine" — it's prompt engineering
- Any team can do this in 30 minutes
- **Counter-argument**: True for the hackathon build. But the ARCHITECTURE we design (embedding-based product matching + contextual re-ranking) is the real moat. For the demo, GPT-backed recommendations are fine. For the pitch, we show the architecture diagram of what it becomes.

### Criticism 4: 36 hours is not enough for a polished SwiftUI app + backend + AI
- SwiftUI frontend with adaptive UI
- Backend API server
- OpenAI integration
- Weather API integration
- Location services
- Mock Shopify catalog
- Push notification flow
- That's 7 components for a team building under pressure
- **Counter-argument**: We scope aggressively. The backend is a single serverless function. The AI call is one endpoint. The weather is one API call. The frontend is 3 screens max. We cut everything that isn't in the core flow.

### Criticism 5: "Small Canadian merchants" isn't a real user you can validate
- You won't have testimonials or user research
- It's a convenient narrative, not a validated problem
- **Counter-argument**: We don't need user validation for a hackathon. We need a compelling narrative. "Canadian winter + local shops + zero-install" is a story judges in Waterloo (in March!) will viscerally understand.

### Criticism 6: The intent chips might feel gimmicky
- 4 preset buttons isn't "AI" — it's a menu
- Where's the intelligence if you're just showing pre-set options?
- **Counter-argument**: The intelligence is in WHICH chips appear. The chips are dynamically generated based on weather, time, location, and URL parameters. At -15°C the chips say "warm jacket" and "cold commute." At 20°C they say "light layers" and "rain gear." The chip SELECTION is the AI moment, then the product ranking is the second AI moment.

### Criticism 7: What if another team builds the exact same thing?
- Weather + shopping + App Clip is an obvious combination
- **Counter-argument**: Execution and UX polish differentiate. Our "why this" explanations, the contextual bundle suggestions, and the re-engagement push flow add layers most teams won't think of.

### Criticism 8: The name "FrostFind" is seasonal
- What happens in summer?
- **Counter-argument**: For the hackathon demo in Waterloo in March, it's PERFECT. Seasonal branding matches the demo context. The underlying engine works year-round — the name is just the hackathon brand.

---

## 5. Final Concept After All Critiques

After all criticism, here's what survives and what changes:

### What We Keep
- **Intent-first interaction** (chips, not chat)
- **Weather/location/time context** (but we don't lead with it as innovation — it's the foundation)
- **"Why this" explainable recommendations** (THIS is the real differentiator)
- **One clear flow** (QR/URL → context → intent → ranked products → cart → checkout)
- **Canadian winter angle** (visceral for judges in Waterloo in March)
- **Mock Shopify catalog** (realistic but acknowledged as mock)

### What We Change
- **Add a "surprise me" mode** — Instead of just intent chips, one chip says "Surprise me" and the AI picks based purely on context + what's trending. This adds delight and novelty.
- **Add social proof signals** — "3 people bought this today" or "Popular in Waterloo this week." This is easy to mock and adds commercial credibility.
- **Add a "share this pick" deep link** — User can share a product recommendation as a URL that opens a NEW Clip instance. This demonstrates viral mechanics and is a novel App Clip use case (Clip-to-Clip sharing).
- **Lead with the EXPLAINABILITY angle, not the weather angle** — Our pitch should be: "Every AI shopping assistant says 'recommended for you.' Ours says WHY. In one sentence. Tied to your actual conditions. In under 15 seconds. Without knowing anything about you."
- **Rename the backend** — Not "visual database" or "enrichment engine." Call it the **"Context Engine"** — simple, accurate, not overblown.

### Final One-Liner
> "FrostFind is an AI App Clip that explains WHY a product is right for you — using weather, location, and intent — in under 15 seconds, with zero install and zero history."

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S iPHONE                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │           FrostFind App Clip (SwiftUI)              │  │
│  │                                                      │  │
│  │  1. URL Invocation → Parse merchant/category params  │  │
│  │  2. CoreLocation → Get lat/lon                       │  │
│  │  3. Display contextual intent chips                  │  │
│  │  4. User taps intent → POST to Context Engine        │  │
│  │  5. Display ranked products with "why this"          │  │
│  │  6. Cart → Checkout handoff                          │  │
│  │  7. Push notification (ephemeral token)              │  │
│  └─────────────────┬──────────────────────────────────┘  │
│                     │ HTTPS                               │
└─────────────────────┼───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              CONTEXT ENGINE (Backend API)                 │
│              Supabase Edge Function / Vercel              │
│                                                          │
│  Endpoints:                                              │
│  POST /api/context                                       │
│    Input: { lat, lon, intent, merchant_id, category }    │
│    Steps:                                                │
│      1. Fetch weather from Open-Meteo API (free, no key) │
│      2. Load merchant product catalog from DB             │
│      3. Build prompt with context + products + intent     │
│      4. Call OpenAI API (GPT-4o-mini for speed)           │
│      5. Return ranked products + "why this" explanations  │
│                                                          │
│  POST /api/chips                                         │
│    Input: { lat, lon, merchant_id, time }                │
│    Steps:                                                │
│      1. Fetch weather                                    │
│      2. Generate contextual intent chips                  │
│      3. Return 4 chip labels + icons                     │
│                                                          │
│  GET /api/products/:merchant_id                          │
│    Returns: Full product catalog for a merchant           │
│                                                          │
│  Database: Supabase (PostgreSQL)                         │
│    Tables:                                               │
│      - merchants (id, name, category, location)          │
│      - products (id, merchant_id, name, price,           │
│                  description, image_url, tags,            │
│                  temp_rating, use_cases, materials)       │
│      - interactions (id, session_id, intent, products,   │
│                      timestamp, weather_context)          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow (Complete)
1. **User scans QR / taps ad** → URL: `frostfind.app/shop/maple-outfitters/winter`
2. **Clip opens** → Parses URL: merchant=`maple-outfitters`, category=`winter`
3. **Clip requests location** → CoreLocation → lat/lon
4. **Clip calls `POST /api/chips`** → Backend fetches weather (Open-Meteo) + time → Returns 4 contextual intent chips
5. **User taps an intent chip** (e.g., "Warm jacket")
6. **Clip calls `POST /api/context`** → Backend builds prompt → Calls GPT-4o-mini → Returns 3 ranked products with explanations
7. **User sees ranked products** with "why this" one-liners
8. **User taps "Add to Cart"** → Cart summary with bundle suggestion
9. **User taps "Checkout"** → Simulated Shopify checkout handoff
10. **If user leaves** → Ephemeral push notification within 8 hours: "Still thinking about the Arctic Explorer Parka? It's dropping to -20°C tonight."

---

## 7. Frameworks & Stack

### Frontend (App Clip)
| Component | Technology |
|---|---|
| Language | Swift 5.0 |
| UI Framework | SwiftUI |
| Networking | URLSession (native, no dependencies) |
| Location | CoreLocation |
| Architecture | MVVM (lightweight) |
| Target | iOS 26+ iPhone Simulator |

### Backend (Context Engine)
| Component | Technology |
|---|---|
| Runtime | Supabase Edge Functions (Deno/TypeScript) |
| Database | Supabase PostgreSQL |
| AI | OpenAI GPT-4o-mini (fast, cheap, good enough) |
| Weather | Open-Meteo API (free, no API key needed) |
| Hosting | Supabase (free tier) |

### Why These Choices
- **Supabase Edge Functions**: Free tier, instant deploy, TypeScript, no cold start issues. Perfect for hackathon.
- **GPT-4o-mini**: ~100ms response time, $0.15/1M input tokens. Fast enough for real-time, cheap enough for demo.
- **Open-Meteo**: Completely free, no API key, fast, accurate Canadian weather data.
- **No external Swift dependencies**: Required by Reactiv ClipKit rules.
- **MVVM in SwiftUI**: Simple, clean, testable. ViewModels handle API calls, Views stay declarative.

---

## 8. Step-by-Step Build Plan

### Phase 1: Backend Foundation (Hours 0-4)
**Step 1.1**: Set up Supabase project
- Create project on Supabase
- Set up database tables (merchants, products, interactions)
- Seed with realistic Canadian outerwear data (15-20 products)

**Step 1.2**: Build `/api/chips` endpoint
- Accept lat/lon + merchant_id + time
- Call Open-Meteo for weather
- Return 4 contextual intent chips based on weather/time/category logic

**Step 1.3**: Build `/api/context` endpoint  
- Accept lat/lon + intent + merchant_id + category
- Fetch weather from Open-Meteo
- Load products from DB
- Build GPT-4o-mini prompt with structured output
- Return ranked products with "why this" explanations
- Structured JSON response format

**Step 1.4**: Test all endpoints via curl/Postman

### Phase 2: App Clip Frontend (Hours 4-10)
**Step 2.1**: Clone Reactiv ClipKit Lab repo and set up submission folder
- Run `scripts/create-submission.sh "FrostFind"`
- Define clip identity (urlPattern, clipName, etc.)

**Step 2.2**: Build the Context Screen (Screen 1)
- Parse URL parameters (merchant, category)
- Request CoreLocation permission + get lat/lon
- Call `/api/chips` endpoint
- Display weather context banner ("❄️ -15°C in Waterloo")
- Display 4 intent chips with icons
- Animate chip appearance

**Step 2.3**: Build the Recommendations Screen (Screen 2)
- On chip tap, call `/api/context` endpoint
- Display loading state (skeleton cards)
- Show 3 ranked product cards with:
  - Product image (placeholder or URL)
  - Name + price
  - "Why this" one-liner
  - "Best Match" badge on #1
- Bundle suggestion at bottom
- "Add to Cart" button

**Step 2.4**: Build the Cart/Checkout Screen (Screen 3)
- Cart summary (selected items + bundle)
- Total price
- "Checkout" button (simulated Shopify handoff)
- Success confirmation

**Step 2.5**: Polish transitions and animations
- Smooth screen transitions
- Loading states
- Error handling (no location, no network)

### Phase 3: Intelligence & Polish (Hours 10-16)
**Step 3.1**: Implement "Surprise Me" chip
- Random intent generation based purely on context
- Different product selection logic

**Step 3.2**: Add social proof
- "Popular in [city] this week" labels
- Mock purchase counts

**Step 3.3**: Add share deep link
- Generate shareable URL for a specific product recommendation
- When opened, Clip shows that specific product with context

**Step 3.4**: Push notification simulation
- Show how ephemeral push would work
- Display notification UI mockup
- "Dropping to -20°C tonight. The Arctic Explorer Parka is still in your cart."

### Phase 4: Demo & Submission (Hours 16-20)
**Step 4.1**: Record screen recordings
- Full flow: QR scan → context → intent → recommendations → cart → checkout
- Push notification re-engagement flow
- Different weather/location scenarios

**Step 4.2**: Fill out SUBMISSION.md
- Problem framing
- Solution description
- Platform extensions
- Impact hypothesis

**Step 4.3**: Write README
- Fun, engaging, clear
- Architecture diagram
- Screenshots/GIFs

**Step 4.4**: Create PR to Reactiv repo

**Step 4.5**: Submit on Devpost with all required materials

### Phase 5: Pitch Preparation (Hours 20-22)
**Step 5.1**: Build pitch narrative (see Section 9)
**Step 5.2**: Practice 3-minute delivery
**Step 5.3**: Prepare for Q&A (common judge questions)

---

## 9. Pitch Script (3 min)

### Opening Hook (15 seconds)
"It's -15 degrees outside right now. If you walked past a local shop on King Street, you'd see a nice window display and a QR code. You'd think: 'I need a warm jacket but I don't want to browse a clunky mobile site in the cold.' So you don't go in. The merchant loses the sale. That happens thousands of times a day across Canada."

### Problem (30 seconds)
"Small Canadian merchants can't compete with Amazon's recommendation engine. They don't have user profiles, browsing history, or million-dollar AI budgets. And shoppers won't download an app for a store they might visit once. The result: high-intent shoppers walk away, and merchants have no way to capture that moment."

### Solution (45 seconds)
"FrostFind is an AI-powered App Clip that captures that moment. Scan a QR code or tap an ad, and in under 15 seconds — with zero install, zero login, and zero browsing history — you get product recommendations that explain WHY each item is right for you."

[LIVE DEMO]

"Watch. I scan this QR for Maple Outfitters. The Clip opens. It already knows it's -15°C in Waterloo. It asks me one question with smart intent chips. I tap 'Warm jacket.' Three products appear, each with a one-line reason: 'Rated to -30°C, waterproof, best for your conditions.' I add the top pick and matching gloves. Checkout. Done. 12 seconds."

### Differentiator (30 seconds)
"Every AI shopping assistant says 'recommended for you.' FrostFind says WHY. In one sentence. Tied to your actual weather, location, and intent. And it does it in an ephemeral App Clip — the format Reactiv built for exactly this kind of moment. No app install. No account. No history needed."

### Business Model & Moat (30 seconds)
"Behind the Clip is our Context Engine — a lightweight AI layer that turns weather, location, and time into explainable product intelligence. For the merchant, it's a Shopify install and a QR code. For the shopper, it's 15 seconds to the right product. For Reactiv, it's a new App Clip use case that drives real commerce. The 30-day extension: we add real Shopify checkout, multi-merchant support, and bilingual EN/FR recommendations."

### Close (10 seconds)
"FrostFind: the right product, the right reason, the right moment. Questions?"

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OpenAI API latency > 3s | Medium | High | Use GPT-4o-mini, pre-warm, cache common patterns |
| Open-Meteo API down | Low | High | Cache last weather response, fallback to time-based chips |
| CoreLocation permission denied | Medium | Medium | Fallback to IP-based geolocation or default to Waterloo |
| SwiftUI complexity exceeds time | High | High | Cut screens to 2 (context + recommendations), skip cart screen |
| Another team builds same concept | Medium | Medium | Our differentiator is "why this" explainability — nail that |
| Judges don't see the value of mock data | Medium | Medium | Be upfront: "This is the UX. Shopify integration is the 30-day story." |
| Backend cold start on first call | Low | Medium | Pre-warm edge function before demo |
| Internet issues during demo | Medium | High | Pre-cache one full flow as fallback, show screen recording |

---

## Appendix A: Product Seed Data (Canadian Outerwear)

We need 15-20 realistic products for "Maple Outfitters" — a fictional Canadian outerwear shop.

| Product | Price (CAD) | Temp Rating | Use Cases | Key Feature |
|---|---|---|---|---|
| Arctic Explorer Parka | $189 | -30°C | Extreme cold, outdoor work | Waterproof, 800-fill down |
| Urban Thermal Coat | $149 | -20°C | Commuting, city walks | Slim fit, reflective strips |
| Fleece-Lined Shell | $99 | -10°C | Layering, mild cold | Windproof, packable |
| Summit Down Vest | $89 | -15°C | Active outdoor, layering | Lightweight, 650-fill |
| Tundra Softshell Jacket | $129 | -15°C | Hiking, active sports | 4-way stretch, breathable |
| Polar Expedition Parka | $249 | -40°C | Extreme conditions | Fur-lined hood, 900-fill |
| Cityscape Wool Blend Coat | $179 | -10°C | Office, formal occasions | Professional look, warm |
| Trail Runner Windbreaker | $79 | 5°C | Running, light activity | Ultra-light, water-resistant |
| Blizzard Snow Pants | $119 | -25°C | Skiing, snowboarding | Insulated, articulated knees |
| Thermal Base Layer Set | $59 | N/A | Layering foundation | Merino wool, moisture-wicking |
| Insulated Hiking Boots | $159 | -25°C | Winter hiking, snow | Vibram sole, waterproof |
| Merino Wool Beanie | $29 | N/A | Daily wear | Breathable, anti-odor |
| Touchscreen Winter Gloves | $39 | -20°C | Commuting, phone use | Conductive fingertips |
| Heated Insoles | $49 | N/A | Extreme cold feet | USB rechargeable, 8hr battery |
| Neck Gaiter / Balaclava | $25 | N/A | Wind protection | Fleece-lined, UV protection |

---

## Appendix B: Prompt Engineering (Context Engine)

### System Prompt for `/api/context`
```
You are a product recommendation engine for a Canadian retail store.
Given the customer's context (weather, location, time, intent) and the store's product catalog, recommend exactly 3 products ranked by relevance.

For each product, provide:
1. The product name and price
2. A one-sentence "why this" explanation that directly references the customer's context
3. A match score (1-100)

Also suggest one complementary add-on product with a brief reason.

Rules:
- Reference specific weather conditions in your explanations (e.g., "rated to -30°C" when it's -15°C out)
- Reference the customer's stated intent
- Keep explanations under 20 words
- Be specific, not generic (never say "great for you" — say WHY)
- Prices are in CAD
- Respond in JSON format only
```

### Example Prompt
```
Customer context:
- Location: Waterloo, ON, Canada
- Weather: -15°C, snowing, wind 25 km/h
- Time: 7:45 PM (evening)
- Intent: "Warm jacket for daily commuting"
- Store: Maple Outfitters (winter outerwear)

Product catalog:
[... products array ...]

Recommend 3 products + 1 add-on in JSON format.
```

### Expected Response Format
```json
{
  "recommendations": [
    {
      "product_id": "arctic-explorer-parka",
      "rank": 1,
      "match_score": 95,
      "why_this": "Rated to -30°C with waterproof shell — handles tonight's -15°C and wind easily.",
      "badge": "Best Match"
    },
    {
      "product_id": "urban-thermal-coat",
      "rank": 2,
      "match_score": 82,
      "why_this": "Slim commuter fit with reflective strips for evening walks in the snow.",
      "badge": null
    },
    {
      "product_id": "tundra-softshell",
      "rank": 3,
      "match_score": 68,
      "why_this": "Breathable and flexible — good if your commute includes walking or cycling.",
      "badge": "Active Pick"
    }
  ],
  "addon": {
    "product_id": "touchscreen-gloves",
    "why_this": "Keep using your phone in -15°C without exposing your hands.",
    "price": 39
  },
  "context_summary": "❄️ -15°C and snowing in Waterloo"
}
```

---

## 11. Final Argument: What Could Still Be Improved

After writing this entire document, here is an honest critique of the PLAN ITSELF and what could be improved:

### Argument 1: The backend is over-engineered for a hackathon
**Problem**: Supabase Edge Functions + PostgreSQL + seeded product data + two API endpoints is a lot of backend for a 36-hour hackathon. If anything goes wrong with Supabase deployment, you lose hours debugging infra instead of building the experience.

**Improvement**: Consider a **single hardcoded JSON file** for the product catalog baked into the backend (or even into the Swift app itself). Use a single serverless function (Vercel or even a simple Express server on Replit) that takes context + products and calls OpenAI. Skip the database entirely for the hackathon. The database is a 30-day story.

**Decision**: We'll use Supabase for the DB (it's fast to set up and we already have access), but if it takes more than 1 hour, we fall back to hardcoded product data in the edge function itself.

### Argument 2: Two backend endpoints is unnecessary
**Problem**: `/api/chips` and `/api/context` are separate calls. The chips endpoint fetches weather, then the context endpoint fetches weather AGAIN. That's redundant. And two round trips from the Clip means more latency.

**Improvement**: **Merge into one endpoint: `/api/recommend`**. It takes lat/lon + merchant_id. It returns BOTH the chips AND a pre-computed "surprise me" recommendation. When the user taps a chip, the app makes a SECOND call with the intent. But the weather is only fetched once and cached in the first call.

**Even better**: Return chips + pre-fetched recommendations for ALL chips in one call. The product catalog is small (15-20 items), so the AI can rank products for all 4 intents at once. Then the chip tap is INSTANT — no second network call. The UX feels magical.

**Decision**: We'll try the "pre-fetch all intents" approach. If the GPT response is too slow (>3s), we fall back to two separate calls.

### Argument 3: The SwiftUI build might be the bottleneck
**Problem**: Building 3 screens (context, recommendations, cart) with animations, loading states, error handling, and proper MVVM in SwiftUI — on a tight deadline — is risky. SwiftUI has quirks. Layout debugging is slow.

**Improvement**: **Cut to 2 screens**. Screen 1: Context + Intent Chips. Screen 2: Recommendations + inline "Add to Cart" + checkout button. No separate cart screen. The checkout is a single confirmation alert or sheet. This saves 2-3 hours of UI work.

**Decision**: Start with 2 screens. If time permits, add the cart as a bottom sheet, not a separate screen.

### Argument 4: The "share a pick" feature is scope creep
**Problem**: Generating shareable deep links that open new Clip instances is cool but adds complexity. URL routing, dynamic link generation, handling the receiving end... it's a feature that sounds great in a pitch but costs 2-3 hours to build properly.

**Improvement**: **Cut it from the weekend build.** Mention it in the pitch as a "next step" or "30-day extension." Focus the demo time on the core flow.

**Decision**: Cut. Mention in pitch only.

### Argument 5: Push notification simulation is risky to demo
**Problem**: You can't actually send push notifications in the simulator without real App Clip entitlements. Showing a "mock" notification might look hacky to judges.

**Improvement**: Instead of simulating a push notification, **show a re-engagement screen** within the app. When the user "returns" to the Clip (simulated by tapping the URL again), show a "Welcome back" screen: "You were looking at the Arctic Explorer Parka. It's now -20°C — still interested?" This demonstrates the RE-ENGAGEMENT concept without faking a push notification.

**Decision**: Build the re-engagement screen instead of push simulation.

### Argument 6: The pitch script doesn't mention the Reactiv platform enough
**Problem**: This is a SPONSOR TRACK. Reactiv is giving $5000/$2500/$1000. The pitch should make Reactiv look good. The current script barely mentions Reactiv.

**Improvement**: Add a line like: "FrostFind is built specifically for the Reactiv Clips platform because Reactiv solves the two hardest problems — instant access and re-engagement — and we add the intelligence layer on top. Together, it's a complete commerce moment."

**Decision**: Update pitch script to explicitly credit Reactiv's platform.

### Argument 7: No fallback if the AI gives bad recommendations
**Problem**: GPT-4o-mini might hallucinate product names, give wrong prices, or produce generic "great for you" explanations despite the prompt. Live demo + unpredictable AI = risk.

**Improvement**: **Pre-cache the demo scenario.** For the exact weather/location/intent combination you'll use in the demo, hardcode the response as a fallback. If the live API call succeeds, use it. If it fails or returns garbage, show the cached response. The judges never know.

**Decision**: Build the live flow but cache one golden demo path as insurance.

### Argument 8: The product images problem
**Problem**: The App Clip needs product images. You can't use copyrighted photos from real brands. Generating images takes time. Placeholder boxes look amateurish.

**Improvement**: Use **SF Symbols** (Apple's built-in icon set) as product "category icons" instead of photos. A parka icon, a glove icon, a boot icon. Combined with good typography and color, this looks INTENTIONALLY minimalist and design-forward, not lazy. Alternatively, use free stock photos from Unsplash with proper sizing.

**Decision**: Use SF Symbols for speed, upgrade to Unsplash images if time permits.

---

## 12. Revised Build Plan (Post-Critique)

Based on all arguments above, here's the ACTUAL build order:

### Step 1: Backend — Single Edge Function (1.5 hours)
- Set up Supabase project
- Create one edge function: `/api/recommend`
- Hardcode product catalog in the function (skip DB for now)
- Integrate Open-Meteo weather API
- Integrate OpenAI GPT-4o-mini
- Return: context summary + 4 intent chips + pre-ranked products for each intent
- Test with curl

### Step 2: App Clip — Screen 1: Context + Chips (2 hours)
- Set up submission folder in ClipKit Lab
- Define clip identity and URL pattern
- Build context screen:
  - Weather banner
  - 4 animated intent chips
  - "Surprise me" chip
- CoreLocation integration
- Call backend on load, display chips

### Step 3: App Clip — Screen 2: Recommendations (2 hours)
- On chip tap, instantly show pre-fetched recommendations (no second API call)
- 3 product cards with SF Symbol icons, name, price, "why this"
- "Best Match" badge on #1
- Bundle suggestion
- "Add to Cart" button → confirmation sheet
- "Checkout" button → success view

### Step 4: Re-engagement Screen (1 hour)
- When Clip is opened a second time (same URL), show "Welcome back" screen
- Display previously viewed product with updated weather context
- "Still interested?" CTA

### Step 5: Polish & Edge Cases (1.5 hours)
- Loading skeleton states
- Error handling (no location → default to Waterloo)
- Smooth transitions and animations
- Cache golden demo path as fallback

### Step 6: Demo Materials (1 hour)
- Screen recordings of full flow
- SUBMISSION.md
- README
- PR to Reactiv repo

### Step 7: Pitch Prep (1 hour)
- Finalize pitch script with Reactiv callout
- Practice timing
- Prepare Q&A answers

**Total estimated time: ~10 hours of focused work**

This leaves buffer for debugging, unexpected issues, and sleep.
