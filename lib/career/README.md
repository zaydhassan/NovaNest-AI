# lib/career — Career OS service + agent layer

The architecture layer that turns NovaNest from a 5-tool SaaS into an **AI
Career Operating System**: long-term memory, an auto-generated career timeline,
agentic AI (specialized agents + a Coordinator), a Career Health engine, a
Career Twin, a proactive Coach, a GitHub Project Analyzer, and a Learning
Engine.

This is **server-only**. Never import `@/lib/career/*` into a client component
— these modules touch the database and call Gemini. Server actions
(`actions/*.js`) and Inngest functions (`lib/inngest/*`) are the only callers.

## Layout

```
lib/career/
  index.js                     barrel — public API surface
  memory/
    memory-service.js          Memory Service — create/recall/forget/list/extractAndWrite
    memory-extractors.js       (M2) per-source extractors: fromChat/fromMock/fromResume/...
    interview-memory.js        (M3) parseFeedback(mock) + trend helpers
    relevance.js               pure relevance scoring (keyword/type/recency/importance/cosine)
  timeline/
    timeline-engine.js         Timeline Engine — record/list/backfill
    timeline-derivers.js        pure fns: resume→event, application→event, mock→event, ...
  career/
    career-engine.js           (M4) computeHealthScore — extends lib/nova-score.js
    readiness.js               (M4) interview readiness
    skill-growth.js            (M4) skill proficiency over time
  analytics/
    analytics-service.js       (M6) trends + aggregates
    interview-trends.js        (M6) MockInterview.feedback history → trend data
  recommendations/
    recommendation-service.js  (M9) nextBestAction
    next-topics.js             (M9) ranked topics to learn
  prompts/
    prompt-service.js          (M2) build(id, ctx) prompt registry
    prompts-career-os.js       (M2) new tagged-template builders (see lib/ai/prompts.js)
  embeddings/
    embedding-service.js       (M7, flag-gated) embed/cosine
  agents/
    base.js                    (M5) BaseAgent run({userId,input,memory,ctx,tx})
    coordinator.js             (M5) intent routing + dispatch + synthesis
    *.agent.js                 (M5+) specialized agents
    index.js                   (M5) registry + capability map
  ui/                          pure helpers (no JSX)
    chat-context.js            (M5) build the system+memory context object
    citations.js               (M5) map memory ids → citation metadata
```

## Conventions

- **tx-join pattern**: every write helper accepts `tx` and falls back to the
  shared `db` (mirrors `lib/notifications.js` + `lib/gamify.js`). Callers wrap
  memory/timeline/notification writes in one `db.$transaction` so they commit
  atomically with the primary action.
- **No Prisma enums**: enum-like columns are plain `String`, mirrored by
  constant arrays in `lib/constants.js` (`MEMORY_TYPES`, `TIMELINE_TYPES`, …),
  following the existing `APPLICATION_STATUSES` pattern.
- **Idempotent writes**: memory + timeline dedupe on
  `(userId, source, sourceId)` / `(userId, sourceType, sourceId)` so backfill
  and re-derivation never duplicate.
- **Single AI entrypoint**: every agent Gemini call goes through
  `lib/ai/gemini.js` (`generateText` / `generateJSON` / `generateTextStream`).
  New prompts are tagged-template builders in `prompts/prompts-career-os.js`.

See the plan at `C:\Users\ZAYD\.claude\plans\velvet-whistling-whistle.md` for the
full module roadmap (M1–M10).