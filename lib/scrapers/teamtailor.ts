import { tagTrack, tagLevel, isUSLocation, buildTags, isRecent, type ScrapedJob } from "./utils";
import { TEAMTAILOR_COMPANIES } from "./company-seeds";

// Teamtailor career pages expose job data at:
// https://{slug}.teamtailor.com/jobs.json
// Returns an array of job objects.

interface TTJob {
  id: number | string;
  title: string;
  body: string; // HTML description
  human_status: string; // "open" | "closed"
  created_at: string; // ISO
  apply_url: string;
  location?: { city?: string; country?: string; remote?: boolean };
  locations?: { city?: string; country?: string }[];
}

function extractLocation(job: TTJob): string {
  if (job.location?.remote) return "Remote";
  const city = job.location?.city ?? job.locations?.[0]?.city ?? "";
  const country = job.location?.country ?? job.locations?.[0]?.country ?? "";
  return [city, country].filter(Boolean).join(", ");
}

async function fetchCompanyJobs(
  slug: string,
  companyName: string
): Promise<ScrapedJob[]> {
  const url = `https://${slug}.teamtailor.com/jobs.json`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Jobseek/1.0",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 403) return [];
    throw new Error(`Teamtailor ${slug}: HTTP ${res.status}`);
  }

  let data: TTJob[];
  try {
    data = await res.json();
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  const jobs: ScrapedJob[] = [];

  for (const job of data) {
    if (job.human_status && job.human_status !== "open") continue;

    // 48-hour recency filter
    if (!isRecent(job.created_at)) continue;

    const location = extractLocation(job);
    if (!isUSLocation(location)) continue;

    const title = job.title ?? "";
    // Strip basic HTML tags from body for description
    const description = (job.body ?? "").replace(/<[^>]+>/g, " ").trim();
    const track = tagTrack(title, description);
    if (!track) continue;

    const level = tagLevel(title, description);

    jobs.push({
      source: "teamtailor",
      ats_id: String(job.id),
      title,
      company: companyName,
      location,
      description,
      salary: null,
      tags: buildTags(title, track, level),
      track,
      level,
      url: job.apply_url ?? "",
      posted_at: job.created_at ?? null,
    });
  }

  return jobs;
}

export async function scrapeTeamtailor(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  const errors: string[] = [];

  const BATCH = 5;
  for (let i = 0; i < TEAMTAILOR_COMPANIES.length; i += BATCH) {
    const batch = TEAMTAILOR_COMPANIES.slice(i, i + BATCH);
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
    console.warn("[teamtailor] partial errors:", errors.join(", "));
  }

  console.log(
    `[teamtailor] fetched ${results.length} recent US tech jobs from ${TEAMTAILOR_COMPANIES.length} companies`
  );
  return results;
}
