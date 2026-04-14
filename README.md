# Jobseek

A focused US-only job board for Software Engineering, Data Engineering, and AI/ML roles. Scrapes jobs directly from company ATS portals every 48 hours, and rewrites your resume bullets to match any job using Claude Sonnet.

**Live:** https://jobseek-seven.vercel.app

---

## What it does

- **Browse** — searches jobs across Greenhouse, Lever, Ashby, SmartRecruiters, and Workday. Filter by track (software / data / AI/ML) and level (junior / mid / senior). Search by title or company.
- **Resume Rewrite** — paste any job description, get back a tailored Summary + Skills + Experience rewrite powered by Claude Sonnet 4.5.
- **Tracker** — all jobs you've marked applied, with stats on total applications and jobs viewed this week. Mark Unapplied to remove.
- **Direct ATS links** — every job card links to the original posting.

---

## Running locally

```bash
git clone https://github.com/Saimudragada/jobseek.git
cd jobseek
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seeding jobs

After signup, trigger the scraper:

```bash
curl -X POST http://localhost:3000/api/scrape
```

This runs all 5 scrapers in parallel and inserts the last 48 hours of US tech jobs into Supabase.

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Anthropic API key (resume rewrite) |
| `APIFY_API_TOKEN` | Apify token (Workday scraper) |
| `SERPER_API_KEY` | Serper.dev key (reserved for future scrapers) |
| `RESEND_API_KEY` | Resend key (reserved for email features) |
| `NEXT_PUBLIC_APP_URL` | Full URL of the deployed app |

---

## Tech stack

- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Auth + Storage)
- **AI:** Claude Sonnet 4.5 (rewrite)
- **Scraping:** Direct ATS APIs (Greenhouse, Lever, Ashby, SmartRecruiters) + Apify (Workday)
- **Deployment:** Vercel

---

## ATS sources

| Source | Method | Coverage |
|---|---|---|
| Greenhouse | Public board API | Broad — most SF/NYC tech cos |
| Lever | Public board API | Startups + growth-stage |
| Ashby | Public board API | Early-stage, AI-native |
| SmartRecruiters | Public postings API | Mid-market |
| Workday | Apify actor | Enterprise (Salesforce, Adobe, etc.) |
