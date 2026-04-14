# Claude Code — Jobseek Operating Rules

## Who You Are
You are the sole engineer building Jobseek — a focused US-only job search app.
Work phase by phase, test before marking anything done, never drift from the plan.

## Before Every Session
1. Read plan.md for the full picture
2. Read tasks.md to see exactly where you are
3. State in 2-3 lines what you're about to do, then do it immediately without waiting for permission

## Core Rules — Never Break These

### File Size
- NO file exceeds 600 lines. Ever.
- If a file approaches 500 lines, stop and split it
- Components → /components
- Hooks → /hooks
- Utils → /lib/utils
- API calls → /lib/api
- Scrapers → /lib/scrapers

### Task Discipline
- One subtask at a time, fully complete before moving on
- Mark done in tasks.md ONLY after testing — not when code is written
- If a test fails, fix it before moving on. No exceptions.
- Never ask "should I proceed?" — just proceed

### Testing — Required Before Done
- Auth: test signup, login, logout end to end
- Scrapers: confirm each returns real US jobs
- Match score: confirm returns 0-100 integer
- Resume rewrite: confirm output has ownership verbs + keyword mirroring
- UI: visually verify against /_design/ images
- Use Playwright for automated browser testing when needed

### No Deviation
- Do not add features not in plan.md
- Do not refactor previous phase code while in a new phase
- Log bugs in tasks.md Bugs section, keep moving
- Never ask permission to proceed

## Permissions Granted
- Create, edit, delete any file in the project
- Run terminal commands (npm, git, curl)
- Use Supabase MCP for all DB operations
- Install npm packages as needed
- Run Playwright tests
- Push to GitHub when a phase is complete

## Tech Decisions — Final, Don't Revisit
- Framework: Next.js 14 App Router
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase (MCP for all DB ops)
- AI Rewrite: claude-sonnet-4-5
- AI Scoring: claude-haiku-3-5
- Scraping: Direct APIs first, Apify only for Workday
- Deployment: Vercel

## Job Track Tagging Logic
- software: engineer, developer, backend, frontend, fullstack, mobile, devops, sre, platform
- data: data engineer, data pipeline, etl, spark, airflow, dbt, analytics engineer (NOT analyst, NOT scientist)
- aiml: machine learning, ml engineer, ai engineer, llm, deep learning, nlp, computer vision, mlops

## Experience Level Tagging
- junior: 0-2 years, entry level, new grad, associate
- mid: 2-5 years, mid-level, intermediate
- senior: 5+ years, senior, staff, principal, lead (exclude Director/VP/C-suite)

## Resume Rewrite Prompt Rules
1. Lead every bullet with ownership verb: led, drove, launched, owned, spearheaded, built
2. Format: Result + Metric + Context
3. Mirror exact keywords from target job description
4. Focus on last 5-7 years — compress older roles
5. Balance: Technical Credibility + Business Impact + Leadership
6. Never fabricate — only restructure what exists
7. Plain text bullets only — no complex formatting
8. Briefly explain gaps or short stints inline

## UI Design Reference
Always check /_design/ before building any UI:
- /_design/home.png — Browse page
- /_design/resume.png — Resume rewrite page
- /_design/tracker.png — Tracker page

Design language:
- Background: warm off-white (~#F5F0EB)
- Accent: muted terracotta (~#C17B5C)
- Headings: serif font
- Body: clean sans-serif
- Cards: white, subtle border, generous padding
- Match score: green 80%+, amber 50-79%, red below 50
- Minimal — no gradients, no heavy animations

## Supabase MCP Usage
- Use MCP for all schema changes
- Check if table exists before creating
- RLS enabled on all user data tables
- Service role key: server-side API routes only, never client

## Error Handling
- Every API route returns { data, error }
- Every scraper has try/catch with meaningful messages
- Failed scraper logs error and continues — never crashes feed
- User errors: plain English, no stack traces

## Phase Completion Checklist
Before marking a phase done:
- [ ] All tasks checked off in tasks.md
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] Happy path tested end to end
- [ ] At least one error case tested
- [ ] Committed to GitHub

## Commit Format
feat(phase1): set up auth and supabase schema
feat(phase2): all 8 scrapers working
fix(phase3): job card match score display

## MCP Tools Available
- Supabase MCP: use for ALL database operations, schema creation, migrations
- Playwright: use for end-to-end browser testing after each UI phase
- Run `npx playwright install` at project start