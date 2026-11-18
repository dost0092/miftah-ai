# Miftah AI — مفتاح AI

**Your AI key to property in Saudi Arabia.** Company website for Miftah AI, an AI property advisor for foreigners buying in Saudi Arabia.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · next-intl · Supabase · Vercel
- **Languages:** English, العربية (RTL), اردو (RTL), हिन्दी, 中文: every page, every string
- **Pages:** Home, Product, District Explorer (+ one SEO page per district × 5 languages), Cost Calculator, Pricing, Solutions, Trust & Data, Developers/API, About, Contact, Waitlist, Privacy, Terms, Disclaimer, localized 404
- **Built in:** per-language URLs with hreflang, sitemap.xml, robots.txt, Open Graph, JSON-LD, security headers, honeypot spam protection

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values (optional for local dev)
npm run dev                  # http://localhost:3000 → redirects to /en
```

Without Supabase keys, the waitlist and contact forms still work locally (submissions are logged to the console, not stored). In production they return an error until Supabase is configured.

## 1. GitHub

```bash
git init
git add .
git commit -m "Miftah AI website"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 2. Supabase

1. Create a project at supabase.com (choose a region close to Saudi Arabia, e.g. Frankfurt or Mumbai).
2. **SQL Editor** → paste `supabase/migrations/0001_init.sql` → **Run**. This creates the waitlist and contact tables, plus the core data tables from the build guide (districts, transactions, district_stats, rules with pgvector, reports, chat_logs) with Row Level Security turned on.
3. **Project Settings → API**: copy the **Project URL** and the **service_role** key.

## 3. Vercel

1. vercel.com → **Add New Project** → import the GitHub repo (the Next.js framework is detected automatically).
2. Add these **Environment Variables**:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://miftahai.co` (or your Vercel URL for now) |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key (server-only, never exposed to the browser) |
3. Deploy. Every push to `main` deploys automatically, and every pull request gets a preview URL.
4. Add your domain under **Settings → Domains**.

Waitlist signups appear in Supabase → **Table Editor → waitlist**.

## Project map

```
messages/            en.json is the source of truth; ar/ur/hi/zh mirror its keys (a missing key falls back to English)
src/app/[locale]/    all pages
src/app/api/         waitlist + contact endpoints (zod-validated, write to Supabase)
src/components/      Header, Footer, ChatDemo, DistrictExplorer, CostCalculator, forms…
src/lib/districts.ts ⚠ ILLUSTRATIVE SAMPLE DATA — replace with the MOJ/REGA pipeline output
src/lib/fees.ts      fee rates for the calculator — verify each with ZATCA / REGA before launch
supabase/migrations/ database schema
```

## Signed-in workspace (`/[locale]/app`)

After sign-in users land in the workspace: **Dashboard**, **Miftah AI advisor** (chat with cited sources and saved conversations), **Market map** (districts, prices, ownership status, costs), **Official data** library, **Reports** (district brief, due-diligence checklist, cost estimate; printable to PDF), **Costs** calculator and **Account & usage**.

**Official data + RAG.** `src/lib/official/` holds the official sources and rule summaries (REGA, ZATCA, MOJ/Najiz, Ejar, Premium Residency…). `npm run db:setup` creates the tables in `supabase/migrations/0003_workspace.sql` and loads them into Supabase (`official_sources`, `knowledge_documents`, `knowledge_chunks` with full-text search, `fee_rules`, `districts`, `district_stats`). The advisor retrieves matching passages with the `search_knowledge` SQL function, numbers them, and answers only from them with `[n]` citations. With `ANTHROPIC_API_KEY` set it writes answers with Claude; without it, it quotes the library directly. Until the tables exist, the app reads the same content from the bundled files.

```bash
npm run db:setup -- --dry   # show what will be loaded
npm run db:setup            # uses DATABASE_URL or POSTGRES_URL_NON_POOLING from .env*.local
```

Local design preview without signing in: put `APP_DEV_PREVIEW=1` in `.env.development.local` (never active in production).

## Before public launch: must-do

- [ ] Run `npm run db:setup` against production and set `ANTHROPIC_API_KEY` in Vercel.
- [ ] Have every library entry marked `needs_review` in `src/lib/official/knowledge.ts` checked against the official text, then set `status: "verified"` and `checked`.

- [ ] Replace sample district numbers in `src/lib/districts.ts` with real `district_stats` from the data pipeline (pages already label them "Illustrative sample data").
- [ ] Set each district's `zone` from official REGA publications (currently all `unknown`, "To be verified").
- [ ] Verify fee rates in `src/lib/fees.ts` (5% RETT, 2.5% brokerage cap, 15% VAT, 2% non-Saudi disposal fee).
- [ ] Have the legal pages reviewed by a Saudi lawyer (PDPL, real-estate advertising rules).
- [ ] Set up the `hello@`, `partners@` and `privacy@miftah.ai` mailboxes.

Brand colours: Saudi green `#006C35`, palm `#062A1C`, desert gold `#C49A3C`, sand `#FCFAF5`. The background pattern is inspired by Al-Sadu weaving.
