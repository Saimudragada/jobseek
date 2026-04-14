import { tagTrack, tagLevel, isUSLocation, buildTags, isRecent, type ScrapedJob } from "./utils";
import { ASHBY_COMPANIES } from "./company-seeds";

interface AshbyJob {
  id: string;
  title: string;
  teamName: string;
  isRemote: boolean;
  location: { locationStr: string } | null;
  descriptionPlain: string;
  jobUrl: string;
  publishedAt: string | null; // ISO
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

async function fetchCompanyJobs(
  slug: string,
  companyName: string
): Promise<ScrapedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Jobseek/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Ashby ${slug}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as AshbyResponse;
  if (!Array.isArray(data?.jobs)) return [];

  const jobs: ScrapedJob[] = [];

  for (const job of data.jobs) {
    // 48-hour recency filter
    if (!isRecent(job.publishedAt)) continue;

    const location = job.isRemote
      ? "Remote"
      : (job.location?.locationStr ?? "");
    if (!isUSLocation(location)) continue;

    const title = job.title ?? "";
    const description = job.descriptionPlain ?? "";
    const track = tagTrack(title, description);
    if (!track) continue;

    const level = tagLevel(title, description);

    jobs.push({
      source: "ashby",
      ats_id: job.id,
      title,
      company: companyName,
      location,
      description,
      salary: null,
      tags: buildTags(title, track, level),
      track,
      level,
      url: job.jobUrl ?? "",
      posted_at: job.publishedAt ?? null,
    });
  }

  return jobs;
}

export async function scrapeAshby(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  const errors: string[] = [];

  const BATCH = 5;
  for (let i = 0; i < ASHBY_COMPANIES.length; i += BATCH) {
    const batch = ASHBY_COMPANIES.slice(i, i + BATCH);
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
    console.warn("[ashby] partial errors:", errors.join(", "));
  }

  console.log(`[ashby] fetched ${results.length} recent US tech jobs from ${ASHBY_COMPANIES.length} companies`);
  return results;
}
