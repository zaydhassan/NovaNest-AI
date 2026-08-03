# NovaNest AI

> The AI Career Operating System — one workspace that remembers your career and thinks alongside you.

NovaNest AI is a full-stack SaaS application — an **AI Career Operating System** that ties resume, interviews, applications, learning, memory, and AI coaching into one personalized surface. Instead of a dozen disconnected tools, NovaNest keeps a long-term memory of your career, runs specialist AI agents that coordinate instead of guess, and explains *why* every recommendation is given — with supporting evidence, never a meaningless percentage.

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind + Radix/shadcn UI**, **Prisma + PostgreSQL**, **Clerk** auth, **Google Gemini** AI, **Inngest** background jobs, and **Razorpay** payments. Designed to feel like a real, commercially-viable startup product — premium dark-first "Obsidian" design system, robust server-action architecture, rate-limited AI pipelines, evidence-grounded scoring, and production deployment readiness.

---

## ✨ What's inside

NovaNest is organized into five pillars. Every surface lives behind auth + onboarding, served by validated server actions over a pure Career-OS service layer.

### 1. Home & Workspace
| Module | What it does |
| --- | --- |
| **Dashboard** | The hub: composite **NovaScore** (0–100 across 5 pillars), **Career Health** (7-pillar), skill-growth sparkline, salary band, and your Monday weekly brief — all at-a-glance. |
| **Career Intelligence** (`/intelligence`) | The deep dive: **8 metrics** — Career Health, Resume, Interview Readiness, Learning Velocity, Application Success Rate, Skill Growth, Consistency, Productivity — each with a **score, level, Why / How / What-to-improve**, and **supporting evidence**. Deterministic (no AI-invented numbers); explanations are assembled from the same data that produced the score. |
| **AI Copilot / Coach** (`/coach`) | "ChatGPT with career memory" — persistent chat sessions grounded by long-term career memory, routed through specialist agents, with citations and proactive weekly **CoachInsights** (nudge / progress / risk / celebration). |
| **Memory Engine** (`/memory`) | Durable facts the AI learns (`MemoryEntry`) + curated typed artifacts (`StructuredMemory`: projects, skills, achievements, certificates, lessons, notes) with semantic + ILIKE retrieval and soft-forget. |
| **Career Timeline** (`/timeline`) | Auto-generated milestones derived from 9 activity sources — your career story, built for you. |
| **AI Career Twin** (`/twin`) | A synthesized "AI twin" of you — rebuilt from resume, GitHub, mocks, applications, and memory; answers in your voice. |
| **GitHub Analyzer** (`/github`) | Connect a repo (PAT hashed with SHA-256, never stored) and get a senior-staff-engineer 6-section review — architecture, risks, grade, action items. Run as an Inngest job. |
| **Notifications** (`/notifications`) | In-app event feed + header bell for every meaningful action, weekly digest, coach insight, and twin/github completion. |

### 2. Pipeline
| Module | What it does |
| --- | --- |
| **Resume Builder** (`/resume`) | Dynamic, ATS-friendly resumes with a live Markdown editor, AI entry improvement, one-click PDF export, and autosave. Every save triggers a background industry-ATS rescore. |
| **Cover Letters** (`/ai-cover-letter`) | AI cover-letter generation from a job description, with search, sort, and filtered management. |
| **Application Tracker** (`/applications`) | Drag-and-drop Kanban pipeline (Saved → Applied → Screening → Interview → Offer / Rejected) with resume↔JD **ATS matching** — score, matched/missing keywords, and concrete edits. |
| **AI Career Tools** (`/ai-tools`) | Achievement rewriter (STAR/XYZ), 8-week skill roadmap generator, cold-outreach message writer (LinkedIn/email), and a job-fit scorer. |

### 3. Prep
| Module | What it does |
| --- | --- |
| **Interview Prep** (`/interview`) | Role-specific AI quiz generation, progress tracking, performance trend analytics, and AI improvement tips after each attempt. |
| **Voice Mock Interview** (`/interview/mock`) | A spoken mock using the browser Web Speech API — the AI asks one question at a time, you answer out loud, and the full transcript is scored by Gemini across communication / technical depth / structure. |
| **Quick Quiz** (`/interview/quiz`) | Fast, role-specific quizzes with scoring + AI improvement tips. |
| **Learning Engine** (`/learning`) | Track skills/topics, log learning sessions, and get company-aware recommendations (priority-ranked from your weaknesses, industry demand, and — if set — your dream company's bar). |

### 4. Intelligence
| Module | What it does |
| --- | --- |
| **Industry Insights** | AI-analyzed salary ranges, growth rate, demand level, top skills, key trends, and a personalized **skill-gap** analysis (your skills vs. market demand). Refreshed weekly via Inngest cron. |
| **Dream Company Mode** (`/dream-company`) | Pick 1 of 8 companies (Google, OpenAI, Microsoft, Amazon, Meta, Netflix, Adobe, NVIDIA). Everything personalizes to its hiring bar, values, and interview style — across 7 areas (interview questions, learning roadmap, recommended projects, resume optimization, skill gaps, application strategy, salary) — **with the AI explaining why each recommendation is given**. |
| **Weekly Brief** | A personalized Monday career digest (market pulse, skill to watch, practice question, resume tip, action item), generated by an Inngest cron and shown on the dashboard. |

### 5. Platform
| Module | What it does |
| --- | --- |
| **Auth & Onboarding** | Clerk-backed sign-in/up, profile onboarding with industry/skills selection, protected routes that gate on onboarding completion. |
| **Billing** | Razorpay (INR) checkout for Starter / Pro / Teams plans, server-side HMAC signature verification, plan + entitlement-expiry tracking via `PaymentOrder`. |
| **Gamification** | Daily streaks + XP earned for every productive action (resume saved, mock interview, quiz, cover letter, application, learning session, memory write, goal set, GitHub connect, twin rebuild…) — turning the product into a habit loop, not a one-shot tool. |

---

## 🧱 Tech stack

- **Framework:** Next.js 15.5 (App Router, RSC, Server Actions, Turbopack dev, route groups `(auth)` / `(main)`)
- **Runtime:** React 19, Node ≥ 20
- **UI:** Tailwind CSS 3.4 + shadcn/ui (Radix primitives), Framer Motion 12 (globally honors `prefers-reduced-motion` via `MotionProvider`), Recharts 2 (code-split, `ssr:false`), Lucide icons, Sonner toasts, next-themes (dark default)
- **Design system:** "Obsidian" — glass cards, aurora + noise backgrounds, `PageHeader`, `SpotlightCard`, `Reveal`/`RevealStagger`, `WhyNote`, `EmptyState`/`ErrorState`/`SkeletonCard`
- **Auth:** Clerk (with NovaNest-themed dark appearance) + middleware + per-page onboarding guards
- **Database:** PostgreSQL via Prisma 6.2 (client singleton `db`), hosted on Neon
- **AI:** Google Gemini (`@google/generative-ai`) behind a single shared client (`lib/ai/gemini.js`) with a **model fallback chain** (primary `gemini-3.5-flash` → `gemini-flash-latest` → `gemini-2.0-flash` → `gemini-3.1-flash-lite`; re-resolves on 404/429/quota) + robust balanced-brace JSON parser
- **Background jobs:** Inngest (4 weekly crons + 5 event-triggered functions — see §Inngest)
- **Payments:** Razorpay (INR checkout, server-side HMAC signature verification)
- **Forms/validation:** React Hook Form + Zod (boundary validation on every server action)
- **Markdown:** `@uiw/react-md-editor` + `react-markdown` for resume & cover-letter editing
- **PDF export:** `html2pdf.js` (lazy-loaded) for resume download
- **Notifications:** Sonner (toasts) + in-app `Notification` feed
- **SEO:** `app/robots.js`, `app/sitemap.js`, root metadata with OG/Twitter images, per-page titles, self-contained `app/global-error.jsx`

---

## 🗄️ Data model (23 Prisma models)

**Core user & artifacts**
- `User` — Clerk id, industry/experience/skills/bio, target dream company, XP/streak/lastActiveAt, plan/subscription
- `Resume` (one/user, markdown + atsScore + feedback JSON), `CoverLetter`, `Application` (kanban pipeline), `Assessment` (quiz), `MockInterview` (transcript + denormalized subscores)

**Reference / market**
- `IndustryInsight` (salary, growth, demand, top skills, trends — per industry)
- `CompanyProfile` (company-grained: salary, top/recommended skills, interview themes, famous questions, values, bar — for the 8 dream companies)

**Career OS (the differentiator)**
- `MemoryEntry` — durable facts the AI learns (typed, tagged, importance-weighted, optional embeddings, soft-forget)
- `StructuredMemory` — curated typed artifacts (projects, skills, achievements, certificates, resume versions, lessons, notes) with `pg_trgm` ILIKE retrieval
- `TimelineEvent` — auto-generated career milestones derived from 9 activity sources
- `ChatSession` / `ChatMessage` — persistent chat (Coach), with agent/citation metadata
- `CoachInsight` — proactive nudges (nudge / progress / risk / celebration)
- `CareerTwin` — synthesized AI twin of the user (answers in their voice)
- `CareerGoal`, `LearningTopic`, `LearningSession` — learning engine
- `GitHubRepo` — connected repos + senior-engineer AI review (PAT hashed, never stored)
- `DreamCompanyPlan` — cached 7-area personalized plan per user

**Platform**
- `Notification` (in-app event feed + header bell), `WeeklyDigest` (one/user/week), `PaymentOrder` (Razorpay audit trail)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser — RSC pages + client islands (framer-motion, next-themes)│
└──────────────────────────────────┬───────────────────────────────┘
                                   │  Server Actions (RPC over POST)
┌──────────────────────────────────▼───────────────────────────────┐
│  actions/  (21 server-action files)                              │
│  requireUser() → rateLimit() → Zod → withErrorHandling() →       │
│  revalidatePath(); fire-and-forget side effects (.catch)         │
└──────────────┬───────────────────────────────┬───────────────────┘
               ▼                               ▼
   lib/career/*  (Career OS service layer)   lib/ai/gemini.js  ← AI chokepoint
   agents · analytics · career · intelligence   (single client + fallback chain
   dream-company · memory · timeline · twin      + robust JSON parser)
   github · recommendations · prompts             ▼
               │                            Google Gemini API
               ▼
   lib/prisma.js  →  PostgreSQL (Neon)
               │
   lib/inngest/function.js  →  Inngest (crons + event jobs)
```

### The Career OS service layer (`lib/career/`)
Pure, server-only modules — the engine room. Server actions gather rows and pass them into pure functions (mirrors `lib/nova-score.js`), so scoring is deterministic and testable.
- `agents/` — coordinator + specialist agents (chat, github, etc.)
- `analytics/` — interview trends, `getInterviewTrendsData`
- `career/` — the scoring engines: `computeNovaScore`, `computeHealthScore`, `computeInterviewReadiness`, `computeSkillGrowth`
- `intelligence/` — `computeIntelligence`: 8 metrics, each `{score, level, evidence[], why, how, whatToImprove}` (4 reuse the engines above unchanged + 4 new pure functions)
- `memory/` — `memoryStats` (canonical), recall, extractors, soft-forget
- `timeline/` — auto-generated milestones from 9 sources (idempotent backfill)
- `twin/` — gather sources + build profile
- `github/` — fetch payload + senior-engineer review
- `dream-company/` — company context helpers (kept in a non-action lib so non-async exports don't violate Next.js's async-only-exports rule)
- `recommendations/`, `prompts/`, `embeddings/`, `ui/`

### Scoring engines
- **NovaScore** — weighted 5-pillar 0–100 (resume, interview, cover-letter, applications, market-fit)
- **Career Health** — NovaScore floor + learning + memory pillars (7-pillar)
- **Interview Readiness** — 6 subscores + trend
- **Skill Growth** — rolling-average confidence series
- **Career Intelligence** — assembles all 8 metrics with evidence/why/how/what (4 reuse the above unchanged + 4 new: Learning Velocity, Application Success Rate, Consistency, Productivity)

### Key design decisions
- **Single AI client** (`lib/ai/gemini.js`): one shared client, a robust `parseJSONResponse` (balanced-brace extraction) so fenced/prose-wrapped model output never crashes a page, and a model fallback chain that re-resolves on 404/429/quota. Every AI call in the app goes through this chokepoint.
- **Centralized prompts** (`lib/ai/prompts.js` + `lib/career/prompts/`): the on-demand generators and the weekly Inngest crons share the exact same prompt contracts, keeping output consistent.
- **Auth boundary** (`lib/auth.js`): `requireUser()` replaces copy-pasted `auth() → db.user.findUnique` blocks and throws typed `UnauthorizedError` / `UserNotFoundError`.
- **Server-action discipline**: `"use server"` modules export only async functions; non-async helpers live in non-action lib modules; every action is `requireUser → rateLimit → Zod → withErrorHandling(fn, fallback) → revalidatePath`; side effects (notifications, timeline events, XP) are fire-and-forget `.catch(console.error)`.
- **Evidence-grounded scoring**: scores stay deterministic (never AI-invented percentages); explanations are assembled from the same data that produced the score; every claim cites a concrete data point in `evidence[]`. This is the only design that satisfies "explain Why / How / What to improve", "never show meaningless percentages", and "every score must have supporting evidence".
- **Dream Company Mode** is additive: every recommendation has an optional trailing `company` arg that defaults to `null`; append-only prompt construction guarantees byte-identical output when no company is selected, so the existing surfaces are enhanced in place, never broken.
- **Rate limiting** (`lib/rate-limit.js`): in-memory token bucket guards every paid Gemini call.
- **Typed errors** (`lib/errors.js`): `AppError` hierarchy + `toPublicMessage` ensures toasts never leak DB/AI internals.
- **Payments** (`lib/razorpay.js`, `actions/payments.js`): orders created server-side, checkout signature verified via HMAC before a plan is persisted — no client-trusted payment state.
- **Gamification** (`lib/gamify.js`): `bumpActivity` + `XP_BY_EVENT` (single-sourced; the intelligence engine imports the same map, killing drift risk).

---

## ⚙️ Inngest background jobs

**Weekly crons**
| Job | Schedule | What it does |
| --- | --- | --- |
| `generate-industry-insights` | Sun 00:00 UTC | Refresh every industry's market insight |
| `generate-company-profiles` | Sun 01:00 UTC | Refresh every dream company's `CompanyProfile` |
| `generate-weekly-digests` | Mon 06:00 UTC | Personalized Monday brief per onboarded user (idempotent per week) |
| `weekly-coach-digest` | Mon 06:30 UTC | 3–5 proactive `CoachInsight` rows per user + notifications |

**Event-triggered functions**
| Job | Trigger | What it does |
| --- | --- | --- |
| `backfill-career-timeline` | `timeline/backfill.requested` | Backfill one user's timeline + denormalized mock fields (idempotent) |
| `analyze-github-repo` | `github/repo.connected` | Fetch repo → senior-engineer Gemini review → persist + memory + timeline + notify (PAT used in-job only, then dropped) |
| `rebuild-career-twin` | `twin/rebuild.requested` | Gather all sources → build twin profile → upsert + bump version + notify |
| `score-resume-against-industry` | `resume/saved` | Background industry-ATS rescore on every save (best-effort) |
| `extract-memories-from-source` | `memory/source.created` | Re-run the source-appropriate memory extractor (idempotent) |

---

## 🚀 Getting started

### Prerequisites
- Node.js **>= 20** (see `.nvmrc`)
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- A Clerk application
- A Google Gemini API key
- (Optional) Razorpay keys for billing; Inngest keys for production crons

### Install
```bash
npm install
```

### Configure
```bash
cp .env.example .env.local
# Fill in DATABASE_URL, Clerk keys, GEMINI_API_KEY, NEXT_PUBLIC_APP_URL,
# and (for billing) the Razorpay keys. See .env.example for every var.
```

> **Two env files:** Prisma's CLI reads `.env`, so `DATABASE_URL` lives there. Next.js reads `.env.local` (which takes per-key precedence) for the rest of your secrets. Keep `.env`'s `DATABASE_URL` in sync with `.env.local`.

<details>
<summary><b>Environment variables</b></summary>

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public app URL (metadata base, OG) |
| `DATABASE_URL` | PostgreSQL connection string (also in `.env` for Prisma CLI) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` + fallback redirects | Clerk redirect config |
| `GEMINI_API_KEY` | Google Gemini |
| `GEMINI_MODEL` *(optional)* | Override the fallback chain's starting model |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` *(prod)* | Inngest crons |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server-side Razorpay |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser-side checkout modal |
| `RAZORPAY_WEBHOOK_SECRET` *(optional)* | Async payment webhook verification |

</details>

### Database
```bash
# Recommended (the project uses db push, not migrate dev — see Notes below):
npx prisma db push
npx prisma generate

# Or apply the existing migration set:
npx prisma migrate deploy
```

> **Prisma note:** `migrate dev` can fail with P3006 (shadow-DB) on some Neon setups; `db push` + `db execute` is the reliable path here. Always **stop the dev server before `prisma generate`** (EPERM on `query_engine-windows.dll.node` otherwise).

### Run
```bash
npm run dev      # http://localhost:3000 (Turbopack)
```

### Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `postinstall` | `prisma generate` (runs on `npm install`) |

---

## 🔒 Security & reliability
- Clerk-managed auth; protected routes via `middleware.js` + per-page onboarding guards.
- Server-action input validation with Zod at the boundary.
- Razorpay payments verified server-side via HMAC signature — plan state is never trusted from the client.
- GitHub PATs hashed with SHA-256 (`GitHubRepo.patHash`); the raw PAT is used only inside the Inngest job and then discarded — never persisted.
- Rate-limited AI calls (token bucket per user).
- Robust AI JSON parsing — malformed model output degrades gracefully.
- Security headers on every response (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS).
- Typed error layer prevents internal leakage in toasts.
- Global `error.jsx` boundary + `loading.jsx` states across routes; self-contained `global-error.jsx` for root-layout failures.

---

## ♿ Accessibility
- Skip-to-content link, visible branded focus rings, semantic heading order.
- `aria-label`s on all icon-only controls; form fields wired with `useId` + `htmlFor` (+ `aria-label` on Radix Select triggers, which don't reliably wire `id`); decorative elements `aria-hidden`.
- Respects `prefers-reduced-motion` globally via framer-motion `MotionConfig reducedMotion="user"` (covers JS-driven motion, not just CSS).
- High-contrast tokens verified for both light and dark themes.

---

## 📈 Performance
- Chart-heavy cards code-split with `dynamic({ssr:false})` to keep recharts out of First Load JS (e.g. `/dream-company` 277 → 176 kB).
- Heavy client-only components isolated behind client boundaries (framer-motion's `export *` can't be imported directly in a server component — wrapped in `MotionProvider`).
- Static `robots.js` / `sitemap.js`; per-route `loading.jsx` at the route-group root covers all `(main)` routes via parent-segment behavior.
- Single-sourced `XP_BY_EVENT` map to kill drift between gamification and the intelligence engine.

---

## 📁 Project structure
```
app/
  (auth)/            sign-in, sign-up (Clerk)
  (main)/            22 authenticated surfaces (dashboard, intelligence, resume,
                     ai-cover-letter, ai-tools, applications, interview, coach,
                     twin, github, learning, memory, timeline, dream-company,
                     notifications, onboarding, …)
  api/chat/          streaming Coach chat
  api/inngest/       Inngest endpoint
  robots.js · sitemap.js · global-error.jsx · layout.js · page.js (landing)

actions/             21 server-action files ("use server")
lib/
  ai/gemini.js       single AI chokepoint (fallback chain + JSON parser)
  ai/prompts.*       centralized prompt contracts
  career/            Career OS service layer (agents, analytics, career engines,
                     intelligence, memory, timeline, twin, github, dream-company,
                     recommendations, prompts, embeddings, ui)
  prisma.js · auth.js · rate-limit.js · errors.js · gamify.js
  notifications.js · onboarding.js · razorpay.js · schemas.js · constants.js
  inngest/           client + function.js (9 jobs)
components/
  site/              branded building blocks (header, footer, command palette,
                     coach drawer, reveal, spotlight-card, why-note, state-blocks…)
  ui/                Radix-based shadcn-style primitives
hooks/               use-fetch and friends
prisma/schema.prisma  23 models
```

---

## 📝 Notes & conventions
- **No breaking changes** is a standing constraint. Scoring modules, the AI chokepoint, existing prompt bodies, and dashboard surfaces are treated as a no-regression boundary — features *wrap* or *add alongside*, never rewrite.
- **Dream Company personalization** is trailing-optional: every company-aware function takes `company = null` and produces byte-identical output when unset, so the existing interview/learning surfaces are enhanced in place.
- **Deterministic scoring**: scores are faithful numbers; the AI explains *why*, but never invents the score itself.

---

Built as a polished, production-minded SaaS — an AI Career Operating System that remembers your career and thinks alongside you.