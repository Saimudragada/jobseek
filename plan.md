# Jobseek — Product Plan

## What We're Building
A focused US-only job search app for 3 tracks: Software Engineering, Data Engineering, and AI/ML.
It scrapes jobs directly from company ATS portals, scores them against the user's resume,
and rewrites the resume using recruiter-informed AI prompts.
Built for recent grads and early-career folks who need a real edge.

## Target Users
- Recent grads and job seekers in the US
- 3 role tracks only: Software Engineer, Data Engineer, AI/ML Engineer
- Experience levels: Junior (0-2 yrs), Mid (2-5 yrs), Senior (5+ yrs)
- US positions only, no exceptions

## Core Features (MVP)
1. Auth — email/password login + signup via Supabase Auth
2. Resume Upload — PDF upload, parsed and stored as structured JSON
3. Job Feed — jobs scraped from 8 ATS sources, filtered by track + level
4. Match Score — Haiku scores resume vs job description (0-100%)
5. AI Resume Rewrite — Sonnet rewrites resume bullets for the selected job
6. Application Tracker — mark applied, view history, see avg match score
7. US Filter — hard-coded, every scraper filters US-only

## Tech Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- Database: Supabase (Postgres + Auth + Storage)
- AI Rewrite: claude-sonnet-4-5
- AI Scoring: claude-haiku-3-5
- Scraping: Direct APIs (Greenhouse, Lever, Ashby, SmartRecruiters) + Apify (Workday)
- Email: Resend
- Deployment: Vercel
- File size rule: NO file exceeds 600 lines. Split aggressively.

## ATS Sources (8 total)
| ATS | Method |
|---|---|
| Greenhouse | Public Job Board API |
| Lever | Public Job Board API |
| Ashby | Public Job Board API |
| SmartRecruiters | Public Job Board API |
| Workday | Apify scraper |
| iCIMS | Serper.dev + scrape |
| SAP SuccessFactors | Serper.dev + scrape |
| Teamtailor | Public API |

## Database Schema
users — id, email, created_at, track, experience_level
resumes — id, user_id, raw_text, structured_json, uploaded_at
jobs — id, source, ats_id, title, company, location, description, salary, tags, posted_at, url, track, level
applications — id, user_id, job_id, status, match_score, rewritten_resume, applied_at

## AI Prompting Strategy
Resume rewrite rules (from recruiter research docs):
- Lead every bullet with ownership verbs: led, drove, launched, owned, spearheaded
- Format: Result + Metric + Context
- Mirror exact keywords from job description
- Focus on last 5-7 years only
- Balance: Technical Credibility + Business Impact + Leadership
- Never fabricate — only restructure what exists
- Strip complex formatting for ATS compatibility

## UI Reference
Design screenshots in /_design folder:
- home.png — Browse page with search, source filter pills, job cards, match %
- resume.png — Side-by-side original vs AI Enhanced rewrite
- tracker.png — Application tracker with stats

## Phases

### Phase 1 — Foundation (Days 1-2)
- Next.js project setup with Tailwind + shadcn
- Supabase schema creation via MCP
- Auth flow (signup, login, logout)
- Resume upload + PDF parsing
- Vercel connected

### Phase 2 — Job Scraping (Days 3-4)
- All 8 ATS scrapers built and tested
- Jobs stored in Supabase with deduplication
- US-only filter enforced at scraper level
- Track + level tagging on ingest

### Phase 3 — Job Feed UI (Day 5)
- Browse page matching design reference
- Search, source filters, job cards
- Match % badge, Mark Applied button

### Phase 4 — AI Features (Days 6-7)
- Match scoring via Haiku
- Resume rewrite page with side-by-side diff
- Copy to clipboard post-rewrite

### Phase 5 — Tracker + Polish (Day 8)
- Application tracker page
- Mobile responsive
- Error states + loading skeletons

### Phase 6 — Deploy (Day 9)
- Vercel production deployment
- End-to-end testing
- README updated

## What We Are NOT Building (v1)
- Admin dashboard
- Automated form submission or credential storage
- Non-US jobs
- Analyst or PM roles
- Resume generation from scratch


