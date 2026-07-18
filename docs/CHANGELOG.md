# Changelog

All notable changes to NovaNest AI. Dates are illustrative.

## [1.1.0] — 2026-07

### NovaScore + gamification
- New composite **NovaScore** (0–100) on the dashboard — weighted across resume, interview, cover-letter, application-pipeline, and market-fit pillars, with a level label and per-pillar breakdown (`lib/nova-score.js`).
- **Streaks + XP** gamification: productive actions (save resume, complete quiz, generate cover letter, log/advance an application, finish a mock interview) bump the user's daily streak and XP via `lib/gamify.js`.
- Gamification stats surfaced in the NovaScore card.

### Application Tracker
- New `/applications` route — a drag-and-drop **Kanban pipeline** (Saved → Applied → Screening → Interview → Offer → Rejected) with native HTML5 DnD, add/edit/delete dialog, and per-column counts.
- **Resume ↔ JD ATS match**: score a stored application's job description against the saved resume — overall score, matched/missing keywords, strengths, gaps, and concrete edit recommendations (`Application.atsScore` / `atsFeedback`).

### Voice Mock Interview
- `/interview/mock` rebuilt as a real **voice interview** using the browser Web Speech API (speech recognition + synthesis). The AI interviewer asks one spoken question at a time; the candidate answers by voice (or text fallback); the transcript is scored by Gemini and saved (`MockInterview` model).
- Results card with overall score + communication/technical-depth/structure sub-scores, strengths, and improvements.

### AI Career Tools (`/ai-tools`)
- **Achievement rewriter** — turns a weak bullet into 3 quantified STAR/XYZ achievement variants.
- **Skill roadmap** — generates an 8-week upskilling plan toward a target role (focus, skills, actions, resources per week).
- **Cold-outreach writer** — drafts a LinkedIn note or recruiter email tailored to a target company.
- **Job-fit score** — scores a JD against the user's profile and tells them what to emphasize / how to frame gaps in their cover letter.

### Weekly AI digest
- New Monday Inngest cron (`generate-weekly-digests`) builds a personalized per-user career brief (market pulse, skill to watch, practice question, resume tip, action item) and persists it (`WeeklyDigest` model).
- Latest digest surfaced on the dashboard via the **Weekly brief** card.

### Infrastructure
- Prisma schema extended: `Application`, `MockInterview`, `WeeklyDigest` models; `User` gains `xp`, `streak`, `lastActiveAt`.
- Gemini client now resolves a **model fallback chain** (`gemini-3.5-flash` → `gemini-flash-latest` → `2.0-flash` → `3.1-flash-lite`) so the app self-heals when Google retires a model mid-session.
- New `actions/applications.js`, `actions/mock-interview.js`, `actions/ai-tools.js`; shared prompts centralized in `lib/ai/prompts.js`; boundary schemas in `lib/schemas.js`; constants in `lib/constants.js`.
- Nav (desktop dropdown + mobile sheet) and Clerk middleware updated for the new protected routes.

## [1.0.0] — 2026-07

### Branding
- Rebranded from AspireON / AI Career Coach → **NovaNest AI**.
- New Aurora dark design system (midnight navy, indigo→violet, cyan/amber, glass).
- Inline-SVG `NovaMark` brandmark; removed 1.4MB `logo.png`.
- Display font (Space Grotesk) + Inter body via `next/font`.

### Frontend
- Rewrote landing page; removed 4× broken `/mnt/data/...png` images.
- Replaced 2.3MB hero `banner.png` with an animated CSS/SVG product mock.
- New `components/site/*` chrome: glass header with mobile Sheet menu, multi-column footer, aurora background, section heading, glass card, stat counter.
- Added `sheet`, `skeleton`, `separator` shadcn primitives.
- Route-level `loading.jsx` skeletons + global `error.jsx` boundary + restyled 404.

### Backend
- `lib/ai/gemini.js` — shared Gemini client + robust `parseJSONResponse`.
- `lib/ai/prompts.js` — centralized prompt builders (shared by on-demand + cron).
- `lib/auth.js` — `requireUser()` replacing repeated auth boilerplate.
- `lib/rate-limit.js` — token-bucket limiting on every paid AI call.
- `lib/errors.js` — typed `AppError` hierarchy + safe public messages.
- Moved `app/lib/{helper,schema}.js` → `lib/{markdown,schemas}.js`.

### Bug fixes
- `updateUser` now returns `{ success, user }` (was `undefined`); onboarding redirect works.
- `getUserOnboardingStatus` — removed shadowed `user` redeclaration; single lookup.
- Dashboard charts migrated from hardcoded hex to `--chart-*` tokens.

### Auth & security
- `lib/onboarding.js` `ensureOnboarded()` guards `/resume`, `/interview`, `/ai-cover-letter`.
- Zod boundary validation on `improveWithAI`, `saveQuizResult`, `generateCoverLetter`, `updateUser`.
- `next.config.mjs` security headers (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy, HSTS), AVIF/WebP, `reactStrictMode`.
- `checkUser` structured logging + consistent `null` return.

### Dashboards & UX
- Industry insights: salary chart (tokens), radial growth gauge, **skill-gap** card.
- Interview: 4-KPI stats, gradient area performance trend with trend-delta, empty states.
- Cover letters: search + sort + result count + `/` shortcut + empty state.
- Quiz: progress bar + percentage-complete.

### Docs & deploy
- `.env.example`, `.nvmrc`, `package.json#engines`.
- Rewritten `README.md`; new `docs/` (ARCHITECTURE, DEPLOYMENT, PORTFOLIO, ROADMAP, CHANGELOG).

## [0.1.0] — initial
- Original AspireON AI Career Coach: resume builder, interview prep, cover letters, industry insights, Clerk auth, Prisma, Gemini, Inngest cron.