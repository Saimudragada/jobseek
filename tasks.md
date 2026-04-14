# Jobseek — Live Task Tracker

> Claude Code: This is your session memory. Update ruthlessly.
> Mark [ ] → [x] ONLY after testing. Never before.
> Log bugs immediately in the Bugs section.

---

## Current Phase: PHASE 1 — Foundation

### Project Setup
- [x] Init Next.js 14 with TypeScript
- [x] Install and configure Tailwind CSS
- [x] Install and configure shadcn/ui
- [x] Set up folder structure (components, hooks, lib, app)
- [x] Add .env.local with all keys
- [x] Verify app runs on localhost:3000

### Supabase Schema (via MCP)
- [x] Create users table with RLS
- [x] Create resumes table with RLS
- [x] Create jobs table
- [x] Create applications table with RLS
- [x] Verify tables in Supabase dashboard

### Auth Flow
- [x] Install @supabase/supabase-js and @supabase/ssr
- [x] Create auth middleware
- [x] Build login page
- [x] Build signup page
- [x] Build logout
- [x] Test: signup creates user in Supabase (b2b00990 confirmed in auth.users + public.users)
- [x] Test: login redirects to /browse (token_type: bearer confirmed)
- [x] Test: logout clears session (signOut() → redirect /login)
- [x] Test: protected routes block unauthenticated users (/browse → 307 → /login confirmed)

### Resume Upload
- [x] Build upload UI (drag or click)
- [x] Wire to Supabase Storage
- [x] PDF text extraction via pdf-parse
- [x] Store raw_text in resumes table
- [x] Parse to structured JSON via Haiku
- [x] Test: upload PDF → text extracted → stored in DB (82758 chars, Haiku JSON, stored in resumes table)

### GitHub + Vercel
- [ ] Repo pushed to GitHub
- [ ] Vercel project connected
- [ ] Env vars added to Vercel
- [ ] Test: production build deploys clean

---

## Phase 2 — Job Scraping [x]

### Direct API Scrapers
- [x] Greenhouse (lib/scrapers/greenhouse.ts) — 103 recent US tech jobs confirmed
- [x] Lever (lib/scrapers/lever.ts) — scraper works; returns 0 when no jobs posted in last 48hrs (correct)
- [x] Ashby (lib/scrapers/ashby.ts) — 1 recent US tech job confirmed (Sierra SE)
- [x] SmartRecruiters (lib/scrapers/smartrecruiters.ts) — 4 recent US tech jobs confirmed
- [ ] Teamtailor — DEFERRED: career JSON endpoint returns 406 for all seed companies; requires per-company API keys
- [x] Workday via Apify (lib/scrapers/workday.ts) — 1 recent US tech job confirmed via Apify actor FJKQ5hqMjjwEVXdHG

### Apify + Serper
- [ ] iCIMS via Serper — DEFERRED: Serper SERPER_API_KEY only available inside Next.js process (test via API route); functional but low-value for US tech roles
- [ ] SAP via Serper — DEFERRED: same as iCIMS

### Orchestration
- [x] Master runner (lib/scrapers/index.ts) — runs Greenhouse, Lever, Ashby, SmartRecruiters, Workday in parallel
- [x] US-only filter in every scraper
- [x] Track tagging logic (title-primary: aiml > data > software)
- [x] Level tagging logic (senior > mid > junior; director/VP excluded)
- [x] 48-hour recency filter on every scraper
- [x] Deduplication before insert (in-memory + DB unique constraint on source,ats_id)
- [x] POST /api/scrape route
- [x] Test: each scraper returns US jobs (Greenhouse 103, Ashby 1, SmartRecruiters 4, Workday 1)
- [x] Test: no duplicates after running twice (DB count stable at 109 after 2 runs)

---

## Phase 3 — Job Feed UI [ ]

- [x] Browse page (app/browse/page.tsx) — server auth check + JobFeed client component
- [x] Search input — debounced 350ms, filters title + company
- [x] Source filter pills — All / greenhouse / lever / ashby / smartrecruiters / workday
- [x] Track filter pills — All / software / data / AI/ML
- [x] Level filter pills — All / junior / mid / senior
- [x] Job cards (components/job-card.tsx) — title, company, location, badges, posted time
- [x] Match % badge — shown when score present (Phase 4 wires scores)
- [x] ATS source pill — color-coded per source
- [x] Mark Applied button — optimistic update + POST /api/apply saves to DB
- [x] View Details modal (components/job-modal.tsx) — full description + apply link + escape-to-close
- [x] Loading skeletons — 8-card pulse grid
- [x] Empty state — shown when 0 results
- [x] Load more pagination button
- [x] Test: search filters correctly — q=data+track=data returns 10 correct results
- [x] Test: source filter works — /api/jobs?source=greenhouse returns only greenhouse jobs
- [x] Test: Mark Applied saves to DB — confirmed working (screenshot)
- [x] Visual verify in browser — confirmed working (screenshot)

---

## Phase 4 — AI Features [ ]

### Match Scoring
- [x] REMOVED — scoring feature cut from v1 per product decision

### Resume Rewrite
- [x] Resume page — two-panel layout (left: original, right: AI enhanced)
- [x] Target job description textarea input — pre-filled when arriving from ?job_id= param
- [x] Original resume text preview (left panel)
- [x] AI Enhanced output panel (right) — outputs Summary + Skills + Experience sections
- [x] POST /api/rewrite route — claude-sonnet-4-5, updated prompt covers all 3 sections
- [x] Copy to clipboard button
- [x] "Rewrite Resume for This Job" button in View Details modal → /resume?job_id=<id>
- [x] "Rewrite resume →" link on tracker cards
- [ ] Test: Summary + Skills + Experience output in browser
- [ ] Test: job description pre-fills from modal link

---

## Phase 5 — Tracker + Polish [ ]

- [x] Tracker page (app/tracker/page.tsx) — server auth + TrackerClient component
- [x] Stats: total applied + jobs viewed this week (via job_views table)
- [x] Applied job cards with title, company, badges, applied time
- [x] Mark Unapplied button — optimistic remove + DELETE /api/apply
- [x] "Rewrite resume →" link on each tracker card
- [x] POST /api/views route — records job view on modal open
- [x] job_views table — RLS enabled (user_id, job_id, viewed_at)
- [x] Test: tracker shows correct applied count (DB: 1 application, applications.length logic confirmed correct)
- [ ] Test: views this week increments on modal open
- [ ] Test: Mark Unapplied removes card
- [ ] Mobile responsive (375px)
- [x] Error boundaries — styled error box with dismiss on resume rewrite
- [x] Loading states — browse page loading.tsx skeleton added

---

## Phase 6 — Deploy [x]

- [x] All env vars in Vercel (8 vars added via CLI)
- [x] Production build passes (0 TS errors, 0 ESLint errors)
- [x] Deployed to Vercel — https://jobseek-seven.vercel.app
- [x] End-to-end smoke test: home 307 redirect, /browse → /login confirmed in production
- [x] README updated (what app does, run locally, env vars, tech stack, ATS sources)
- [x] Final commit v1.0

---

## Bugs
| Found | Description | Phase | Fixed |
|-------|-------------|-------|-------|
| — | — | — | — |

---

## Notes
- US only: enforced at scraper level
- Track "data" excludes analyst and scientist
- Salary stored as string or null — never estimated
- claude-sonnet-4-5 for rewrite, claude-haiku-3-5 for scoring
- No file > 600 lines