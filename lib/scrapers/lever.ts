import { tagTrack, tagLevel, isUSLocation, buildTags, isRecent, type ScrapedJob } from "./utils";
import { LEVER_COMPANIES } from "./company-seeds";

interface LeverJob {
  id: string;
  text: string; // title
  categories: {
    location: string;
    team: string;
    commitment: string;
  };
  descriptionPlain: string;
  additionalPlain: string;
  hostedUrl: string;
  createdAt: number; // unix ms
}

async function fetchCompanyJobs(
  slug: string,
  companyName: string
): Promise<ScrapedJob[]> {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json&limit=250`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Jobseek/1.0" },
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Lever ${slug}: HTTP ${res.status}`);
  }

  const data = await res.json();
  // Lever returns { ok: false, error: "..." } when slug not found
  if (!Array.isArray(data)) return [];

  const jobs: ScrapedJob[] = [];

  for (const job of data as LeverJob[]) {
    // 24-hour recency filter — createdAt is unix ms; skip if missing
    if (!isRecent(job.createdAt)) continue;

    const location = job.categories?.location ?? "";
    if (!isUSLocation(location)) continue;

    const title = job.text ?? "";
    const description = `${job.descriptionPlain ?? ""} ${job.additionalPlain ?? ""}`.trim();
    const track = tagTrack(title, description);
    if (!track) continue;

    const level = tagLevel(title, description);

    jobs.push({
      source: "lever",
      ats_id: job.id,
      title,
      company: companyName,
      location,
      description,
      salary: null,
      tags: buildTags(title, track, level),
      track,
      level,
      url: job.hostedUrl ?? "",
      posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    });
  }

  return jobs;
}

export async function scrapeLever(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  const errors: string[] = [];

  const BATCH = 5;
  for (let i = 0; i < LEVER_COMPANIES.length; i += BATCH) {
    const batch = LEVER_COMPANIES.slice(i, i + BATCH);
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
    console.warn("[lever] partial errors:", errors.join(", "));
  }

  console.log(`[lever] fetched ${results.length} recent US tech jobs from ${LEVER_COMPANIES.length} companies`);
  return results;
}
