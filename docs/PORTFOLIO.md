# Portfolio Notes — NovaNest AI Upgrade

This document captures the rationale behind the upgrade from the original **AspireON / AI Career Coach** to **NovaNest AI**, for portfolio presentation.

## The brief

Take an existing, working AI career-coach app and elevate it into a **portfolio-grade SaaS** across nine dimensions — branding, frontend, backend, auth, dashboards/analytics, search/filter UX, performance/accessibility/security, deployment readiness, and documentation — while **preserving all existing functionality**.

## What changed (and why)

### Branding & visual identity → "Aurora dark"
- New identity **NovaNest AI** with an inline-SVG brandmark (`NovaMark`) — replaces a 1.4MB `logo.png`.
- A dark-first **Aurora** design system: midnight navy base (`#070B1A`), indigo→violet primary, cyan/amber accents, glassmorphism, and a refined high-contrast light mode. Tokenized via CSS variables in `app/globals.css` and wired into Tailwind.
- Display font (`Space Grotesk`) for headings + `Inter` body, via `next/font` with CSS variables.
- All marketing copy rebranded (`data/*.js`, header, footer, landing).

### Premium frontend
- A reusable `components/site/*` chrome kit: glass header with proper **mobile Sheet menu**, multi-column footer, `AuroraBackground` (decorative blobs), `SectionHeading`, `GlassCard`, `StatCounter` (extracted from a 90-line inline component).
- Landing page rewritten end-to-end — **all four broken `/mnt/data/...png` references removed**; the 2.3MB `banner.png` hero image is replaced by an animated CSS/SVG product mock (salary chart + stat tiles built from tokens).
- New shadcn primitives added by hand to match `components.json` (new-york, no TS): `sheet`, `skeleton`, `separator`.
- Route-level `loading.jsx` skeletons and a global error boundary.

### Robust backend
- `lib/ai/gemini.js` — one shared Gemini client + robust `parseJSONResponse` (balanced-brace extraction), replacing **five** duplicate client instantiations and fragile `replace(/```json/)` parsing that crashed on fenced output.
- `lib/ai/prompts.js` — single source of truth for prompts, shared by on-demand generation and the weekly cron.
- `lib/auth.js` — `requireUser()` replaces the repeated `auth() → db.user.findUnique` boilerplate in every action.
- `lib/rate-limit.js` — token-bucket limiting on every paid AI call.
- `lib/errors.js` — typed `AppError` hierarchy + safe public message mapping.

### Secure auth & protected flows
- `middleware.js` preserved (Clerk sign-in redirect). Added `lib/onboarding.js` (`ensureOnboarded`) so every protected page redirects un-onboarded users to `/onboarding`.
- Zod boundary validation on `improveWithAI`, `saveQuizResult`, `generateCoverLetter`, `updateUser`.
- `checkUser` now logs structured errors and returns `null` consistently instead of swallowing.

### Smarter dashboards & analytics
- Industry insights dashboard now shows a **salary bar chart using chart tokens** (was hardcoded hex), a **radial growth gauge**, and a **skill-gap card** comparing the user's skills against recommended skills (coverage %, "skills you have", "gaps to close").
- Interview stats expanded to four KPIs (avg, questions, best, latest) with a gradient **area** performance trend and trend-delta badge, plus empty states.

### Search, filters & productivity UX
- Cover-letter manager now supports **search** (company/role/description), **sort** (newest/oldest/A→Z/Z→A), result count, a `/` keyboard shortcut to focus search, and a polished empty state.
- Quiz UI gained a **progress bar** and percentage-complete indicator; option cards highlight on selection.

### Performance, a11y & security
- Removed 2.3MB hero image + 1.4MB logo → inline SVG + CSS mock.
- `next.config.mjs` adds AVIF/WebP image formats, `reactStrictMode`, and security headers (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy, HSTS).
- A11y pass: skip-link, visible focus rings, `aria-label` on icon buttons, `aria-hidden` on decorative blobs, semantic heading order, `prefers-reduced-motion` honored.

### Deployment readiness & docs
- `.env.example`, `.nvmrc`, `package.json#engines`, global `error.jsx`, `loading.jsx` states, restyled 404.
- This `docs/` set: `ARCHITECTURE.md`, `DEPLOYMENT.md`, `PORTFOLIO.md`, `ROADMAP.md`, `CHANGELOG.md`, and a rewritten `README.md`.

## Bugs fixed (not just polish)

| Bug | Fix |
| --- | --- |
| Landing page rendered 4× broken `/mnt/data/...png` images | Replaced with token-driven CSS/SVG mock |
| `updateUser` returned `result.user` (`undefined`) — onboarding never redirected | Returns `{ success: true, user: updatedUser }`; form effect corrected |
| `getUserOnboardingStatus` redeclared `user` (shadowed, redundant 2nd query) | Single lookup, returns gracefully on no session |
| `hero.jsx` shipped 2.3MB `banner.png` | CSS/SVG product mock, no image payload |
| Dashboard charts used hardcoded hex, broke in light mode | Migrated to `--chart-*` tokens |
| Fragile `replace(/```json/)` JSON parsing crashed on fenced output | `parseJSONResponse` balanced extraction |
| AI calls unprotected (paid spend, abuse) | Token-bucket rate limiting |

## What was intentionally preserved

- All four product features keep their behavior (resume, interview, cover letters, insights).
- The Prisma schema and migrations are unchanged.
- No new runtime dependencies — the upgrade works within the existing stack.
- `package-lock.json` is unchanged.