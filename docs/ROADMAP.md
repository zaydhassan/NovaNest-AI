# Roadmap

A prioritized view of what comes next for NovaNest AI. v1.0 productized the
core app; v1.1 added NovaScore + gamification, the application tracker with
ATS matching, voice mock interviews, the AI Career Tools suite, and the weekly
digest. These items push toward a commercial launch.

## Shipped in v1.1
- ✅ NovaScore composite readiness metric + streaks/XP gamification
- ✅ Application tracker (Kanban) with resume↔JD ATS matching
- ✅ Voice mock interview (Web Speech API + Gemini)
- ✅ AI Career Tools: achievement rewriter, skill roadmap, outreach writer, job-fit scorer
- ✅ Weekly AI career digest (Inngest cron + dashboard card)
- ✅ Gemini model fallback chain (self-heals when Google retires a model)

## Short term

- **Multiple resumes per user** — lift the one-resume constraint in the schema and add a resume manager with the same search/sort UX as cover letters; ATS scoring already supports one saved resume.
- **Behavioral interview track** — extend `generateQuiz` to support behavioral + technical categories (the `Assessment.category` field already exists).
- **ATS scoring on the resume builder itself** — surface the same ATS match as a one-click check from the resume page (today it lives in the application tracker).
- **Persistent rate limiting** — swap the in-memory token bucket for Upstash/Redis to support multi-instance deploys.
- **Streaming AI output** — stream Gemini responses for long-form generation (cover letters, improvements) to reduce perceived latency.
- **Email delivery of the weekly digest** — the Inngest cron generates the digest; wire Resend to email it and add a notification inbox.

## Medium term

- **Stripe billing & plan limits** — Free / Pro / Team tiers mapped to AI quotas and feature gates.
- **Team workspaces** — shared industry insights and collaborative resume review.
- **Resume versions per application** — link specific resume versions to applications for A/B ATS scoring.

## Long term

- **Admin analytics** — aggregate, anonymized usage insights for product decisions.
- **Internationalization** — multi-locale UI and localized AI prompts.
- **Mobile app** — React Native shell reusing the Server Actions as a typed API.

## Known limitations

- Rate limiting is per-instance (in-memory); fine for single-instance Vercel, needs Redis for scale.
- Voice mock interview uses the Web Speech API, which is Chromium-based; unsupported browsers fall back to typed answers.
- Cover-letter search is client-side; fine for typical volumes, server-side search needed at scale.
- The weekly digest cron requires the Inngest dev server (or cloud) to be running to fire on schedule.