# Deployment

NovaNest AI deploys cleanly to **Vercel** with a **Neon** PostgreSQL database and **Inngest** for the weekly cron. This guide assumes those providers; equivalents (Supabase, Railway, etc.) work with minimal changes.

## Prerequisites

- Node.js >= 20
- A GitHub repo with this code pushed
- A [Vercel](https://vercel.com) account
- A [Neon](https://neon.tech) Postgres project
- A [Clerk](https://clerk.com) application
- A [Google AI Studio](https://aistudio.google.com/) Gemini API key
- An [Inngest](https://www.inngest.com) account (for the weekly cron in production)

## 1. Database (Neon)

1. Create a Neon project; copy the pooled connection string into `DATABASE_URL`.
2. Apply migrations:
   ```bash
   npx prisma migrate deploy
   ```

## 2. Clerk

1. Create a Clerk application.
2. Set the **Sign-in** and **Sign-up** redirect URLs to `/sign-in`, `/sign-up`, with fallback redirects to `/dashboard` and `/onboarding`.
3. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

## 3. Vercel

1. Import the GitHub repo. Framework preset: **Next.js** (auto-detected).
2. Build command `next build`, output handled automatically.
3. Add **all** variables from `.env.example` under **Project → Settings → Environment Variables**:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_REDIRECT_URL`
   - `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`)
   - `NEXT_PUBLIC_APP_URL` (your production URL)
   - `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (production cron)
4. `postinstall` runs `prisma generate` automatically.
5. Deploy.

## 4. Inngest (weekly cron)

1. In Inngest, add an app endpoint pointing at `https://<your-domain>/api/inngest`.
2. Confirm the `Generate Industry Insights` function registers and the Sunday `0 0 * * 0` schedule is active.
3. For local dev use `npx inngest-cli@latest dev` against `http://localhost:3000/api/inngest`.

## Deployment checklist

- [ ] `DATABASE_URL` set; `prisma migrate deploy` ran successfully.
- [ ] Clerk keys set; sign-in/up redirect URLs configured.
- [ ] `GEMINI_API_KEY` set; AI actions return data.
- [ ] `NEXT_PUBLIC_APP_URL` matches the production origin (used in OG metadata).
- [ ] Inngest endpoint reachable; weekly function registered.
- [ ] Security headers present (check with `curl -I https://<domain>/`).
- [ ] `/sign-in`, `/sign-up`, marketing page, and 404 render.
- [ ] Onboarding → dashboard redirect works for a fresh user.
- [ ] Rate limit triggers after repeated AI calls (test locally).

## Local production smoke test

```bash
npm run build && npm run start
```
Visit `http://localhost:3000` and walk every authenticated flow.