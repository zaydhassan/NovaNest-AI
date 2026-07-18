# Architecture

NovaNest AI is a Next.js 15 App Router application. This document describes the layers, the request lifecycle, the AI pipeline, and the cron job.

## Layers

```
Presentation   app/** (RSC pages) + components/site + components/ui
              ↓ Server Actions (RPC, POST)
Actions       actions/**  — the only mutation/query surface
              ↓ uses
Domain libs   lib/auth, lib/onboarding, lib/rate-limit, lib/errors, lib/schemas, lib/markdown
              ↓ uses
Infra libs    lib/ai/gemini (+ lib/ai/prompts), lib/prisma, lib/inngest/*
              ↓
External      Google Gemini, PostgreSQL, Clerk, Inngest
```

## Request lifecycle (example: generate cover letter)

1. Client calls `generateCoverLetter(data)` (a Server Action).
2. `requireUser()` resolves the Clerk session → DB user; throws `UnauthorizedError` if missing.
3. `coverLetterSchema.safeParse(data)` validates the input at the boundary.
4. `rateLimit({ key: 'cover-letter:<clerkId>', limit, windowMs })` enforces the token bucket.
5. `generateText(coverLetterPrompt(user, data))` calls Gemini via the shared client.
6. The result is persisted with `db.coverLetter.create(...)`.
7. On any error, `lib/errors` maps to a safe public message; the client `useFetch` hook shows a toast.

## AI pipeline

All Gemini access goes through `lib/ai/gemini.js`:

- `getGeminiModel()` — lazily-instantiated singleton client.
- `generateText(prompt)` — returns trimmed text.
- `generateJSON(prompt)` — returns a parsed object via `parseJSONResponse`, which:
  1. strips markdown code fences,
  2. tries `JSON.parse` on the trimmed text,
  3. falls back to balanced-brace/array extraction scanning for the first `{` or `[`,
  4. throws a typed `AIServiceError` on failure.

Prompts are built by `lib/ai/prompts.js` so the on-demand generator and the weekly cron share identical contracts.

## Cron (Inngest)

`lib/inngest/function.js` defines `generateIndustryInsights`, a function scheduled at `0 0 * * 0` (every Sunday 00:00 UTC). For each `IndustryInsight` row it regenerates insights through `generateJSON` and updates the row, advancing `nextUpdate` by 7 days. Each Gemini call is wrapped in its own `step.run(...)` so Inngest can checkpoint and retry per-industry without re-running completed work.

## Data model (Prisma)

- `User` — Clerk-synced identity, industry, skills, bio, experience.
- `IndustryInsight` — per-industry AI analysis (salaries, growth, demand, trends, recommended skills).
- `Resume` — one per user, Markdown content.
- `CoverLetter` — many per user, Markdown + metadata.
- `Assessment` — quiz results, score, per-question outcomes, improvement tip.

See `prisma/schema.prisma` for the full schema.

## Why these choices

- **Server Actions over API routes**: fewer hand-rolled endpoints, type-safe call sites, automatic revalidation via `revalidatePath`.
- **Singleton AI client**: avoids 5× redundant instantiation and lets us harden parsing in one place.
- **Token-bucket rate limit**: protects paid AI spend without introducing a Redis dependency for a single-instance deployment.
- **Typed errors + public message mapping**: defense-in-depth so a Prisma or Gemini error never surfaces in a user-facing toast.