# Jobseek — Live Task Tracker

> Claude Code: This is your session memory. Update ruthlessly.
> Mark [ ] → [x] ONLY after testing. Never before.
> Log bugs immediately in the Bugs section.

---

## Current Phase: PHASE 1 — Foundation

### Project Setup
- [ ] Init Next.js 14 with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up folder structure (components, hooks, lib, app)
- [ ] Add .env.local with all keys
- [ ] Verify app runs on localhost:3000

### Supabase Schema (via MCP)
- [ ] Create users table with RLS
- [ ] Create resumes table with RLS
- [ ] Create jobs table
- [ ] Create applications table with RLS
- [ ] Verify tables in Supabase dashboard

### Auth Flow
- [ ] Install @supabase/supabase-js and @supabase/ssr
- [ ] Create auth middleware
- [ ] Build login page
- [ ] Build signup page
- [ ] Build logout
- [ ] Test: signup creates user in Supabase
- [ ] Test: login redirects to /browse
- [ ] Test: logout clears session
- [ ] Test: protected routes block unauthenticated users

### Resume Upload
- [ ] Build upload UI (drag or click)
- [ ] Wire to Supabase Storage
- [ ] PDF text extraction via pdf-parse
- [ ] Store raw_text in resumes table
- [ ] Parse to structured JSON via Haiku
- [ ] Test: upload PDF → text extracted → stored in DB

### GitHub + Vercel
- [ ] Repo pushed to GitHub
- [ ] Vercel project connected
- [ ] Env vars added to Vercel
- [ ] Test: production build deploys clean

---

## Phase 2 — Job Scraping [ ]

### Direct API Scrapers
- [ ] Greenhouse (lib/scrapers/greenhouse.ts)
- [ ] Lever (lib/scrapers/lever.ts)
- [ ] Ashby (lib/scrapers/ashby.ts)
- [ ] SmartRecruiters (lib/scrapers/smartrecruiters.ts)
- [ ] Teamtailor (lib/scrapers/teamtailor.ts)

### Apify + Serper
- [ ] Workday via Apify (lib/scrapers/workday.ts)
- [ ] iCIMS via Serper (lib/scrapers/icims.ts)
- [ ] SAP via Serper (lib/scrapers/sap.ts)

### Orchestration
- [ ] Master runner (lib/scrapers/index.ts)
- [ ] US-only filter in every scraper
- [ ] Track tagging logic
- [ ] Level tagging logic
- [ ] Deduplication before insert
- [ ] POST /api/scrape route
- [ ] Test: each scraper returns US jobs
- [ ] Test: no duplicates after running twice

---

## Phase 3 — Job Feed UI [ ]

- [ ] Browse page matching /_design/home.png
- [ ] Search input
- [ ] Source filter pills
- [ ] Job cards with all fields
- [ ] Match % badge (green/amber/red)
- [ ] ATS source pill
- [ ] Mark Applied button
- [ ] View Details modal
- [ ] Loading skeletons
- [ ] Empty state
- [ ] Test: search filters correctly
- [ ] Test: source filter works
- [ ] Test: Mark Applied saves to DB

---

## Phase 4 — AI Features [ ]

### Match Scoring
- [ ] POST /api/score route
- [ ] Haiku prompt for scoring
- [ ] Score on job cards
- [ ] Keyword gaps in View Details
- [ ] Test: returns 0-100 integer

### Resume Rewrite
- [ ] Resume page matching /_design/resume.png
- [ ] Target Job Context input
- [ ] Original panel (left)
- [ ] AI Enhanced panel (right)
- [ ] POST /api/rewrite route
- [ ] Sonnet prompt with 8 recruiter rules
- [ ] Copy to clipboard button
- [ ] Save rewrite to applications table
- [ ] Test: output has ownership verbs
- [ ] Test: mirrors job keywords
- [ ] Test: no fabricated content

---

## Phase 5 — Tracker + Polish [ ]

- [ ] Tracker page matching /_design/tracker.png
- [ ] Stats: total, avg match, this week
- [ ] Applied job cards with status
- [ ] Mark Unapplied button
- [ ] Mobile responsive (375px)
- [ ] Error boundaries
- [ ] Loading states
- [ ] Test: tracker counts correct
- [ ] Test: mobile layout

---

## Phase 6 — Deploy [ ]

- [ ] All env vars in Vercel
- [ ] Production build passes
- [ ] End-to-end test on production URL
- [ ] README updated
- [ ] Final commit v1.0

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