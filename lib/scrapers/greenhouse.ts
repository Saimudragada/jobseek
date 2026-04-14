import { tagTrack, tagLevel, isUSLocation, buildTags, isRecent, type ScrapedJob } from "./utils";

// Companies known to use Greenhouse — covers software/data/aiml hiring
const COMPANIES: { slug: string; name: string }[] = [
  { slug: "stripe", name: "Stripe" },
  { slug: "airbnb", name: "Airbnb" },
  { slug: "lyft", name: "Lyft" },
  { slug: "reddit", name: "Reddit" },
  { slug: "pinterest", name: "Pinterest" },
  { slug: "doordash", name: "DoorDash" },
  { slug: "coinbase", name: "Coinbase" },
  { slug: "robinhoodmarkets", name: "Robinhood" },
  { slug: "discord", name: "Discord" },
  { slug: "notion", name: "Notion" },
  { slug: "dropbox", name: "Dropbox" },
  { slug: "twilio", name: "Twilio" },
  { slug: "cloudflare", name: "Cloudflare" },
  { slug: "figma", name: "Figma" },
  { slug: "brex", name: "Brex" },
  { slug: "gusto", name: "Gusto" },
  { slug: "rippling", name: "Rippling" },
  { slug: "plaid", name: "Plaid" },
  { slug: "scaleai", name: "Scale AI" },
  { slug: "datadog", name: "Datadog" },
  { slug: "benchling", name: "Benchling" },
  { slug: "cockroachlabs", name: "Cockroach Labs" },
  { slug: "retool", name: "Retool" },
  { slug: "samsara", name: "Samsara" },
  { slug: "vanta", name: "Vanta" },
  { slug: "snyk", name: "Snyk" },
  { slug: "verkada", name: "Verkada" },
  { slug: "pagerduty", name: "PagerDuty" },
  { slug: "hashicorp", name: "HashiCorp" },
  { slug: "mongodb", name: "MongoDB" },
];

interface GHJob {
  id: number;
  title: string;
  location: { name: string };
  departments: { name: string }[];
  content: string;
  absolute_url: string;
  updated_at: string;
}

interface GHResponse {
  jobs: GHJob[];
}

async function fetchCompanyJobs(
  slug: string,
  companyName: string
): Promise<ScrapedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Jobseek/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    if (res.status === 404) return []; // company not on Greenhouse
    throw new Error(`Greenhouse ${slug}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as GHResponse;
  const jobs: ScrapedJob[] = [];

  for (const job of data.jobs ?? []) {
    // 48-hour recency filter — updated_at is ISO string
    if (!isRecent(job.updated_at)) continue;

    const location = job.location?.name ?? "";
    if (!isUSLocation(location)) continue;

    const title = job.title ?? "";
    const description = job.content ?? "";
    const track = tagTrack(title, description);
    if (!track) continue; // skip non-tech roles

    const level = tagLevel(title, description);

    jobs.push({
      source: "greenhouse",
      ats_id: String(job.id),
      title,
      company: companyName,
      location,
      description,
      salary: null,
      tags: buildTags(title, track, level),
      track,
      level,
      url: job.absolute_url ?? "",
      posted_at: job.updated_at ?? null,
    });
  }

  return jobs;
}

export async function scrapeGreenhouse(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  const errors: string[] = [];

  // Fetch companies in parallel batches of 5
  const BATCH = 5;
  for (let i = 0; i < COMPANIES.length; i += BATCH) {
    const batch = COMPANIES.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map((c) => fetchCompanyJobs(c.slug, c.name))
    );

    for (let j = 0; j < settled.length; j++) {
      const result = settled[j];
      if (result.status === "fulfilled") {
        results.push(...result.value);
      } else {
        errors.push(`${batch[j].slug}: ${result.reason?.message ?? "unknown"}`);
      }
    }
  }

  if (errors.length > 0) {
    console.warn("[greenhouse] partial errors:", errors.join(", "));
  }

  console.log(`[greenhouse] fetched ${results.length} US tech jobs from ${COMPANIES.length} companies`);
  return results;
}
