import { tagTrack, tagLevel, buildTags, isRecent, type ScrapedJob } from "./utils";
import { SMARTRECRUITERS_COMPANIES } from "./company-seeds";

interface SRJob {
  id: string;
  name: string; // title
  department: { id: string; label: string };
  location: {
    city: string;
    country: string; // ISO alpha-2 e.g. "us"
    region: string;
    remote: boolean;
  };
  releasedDate: string; // ISO
  ref: string; // apply URL
}

interface SRResponse {
  offset: number;
  limit: number;
  totalFound: number;
  content: SRJob[];
}

async function fetchCompanyJobs(
  slug: string,
  companyName: string
): Promise<ScrapedJob[]> {
  const url = `https://api.smartrecruiters.com/v1/companies/${slug}/postings?status=PUBLIC&limit=100`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Jobseek/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`SmartRecruiters ${slug}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as SRResponse;
  const jobs: ScrapedJob[] = [];

  for (const job of data.content ?? []) {
    // 24-hour recency filter — skip if releasedDate missing
    if (!isRecent(job.releasedDate)) continue;

    // US filter — SmartRecruiters uses ISO alpha-2 country codes
    const isUS =
      job.location?.country?.toLowerCase() === "us" ||
      job.location?.remote === true;
    if (!isUS) continue;

    const title = job.name ?? "";
    // SmartRecruiters /postings endpoint doesn't include description without
    // a second call; we tag from title only and leave description blank.
    const track = tagTrack(title, "");
    if (!track) continue;

    const level = tagLevel(title, "");
    const location = job.location?.remote
      ? "Remote"
      : [job.location?.city, job.location?.region, "US"]
          .filter(Boolean)
          .join(", ");

    jobs.push({
      source: "smartrecruiters",
      ats_id: job.id,
      title,
      company: companyName,
      location,
      description: "",
      salary: null,
      tags: buildTags(title, track, level),
      track,
      level,
      url: job.ref ?? "",
      posted_at: job.releasedDate ?? null,
    });
  }

  return jobs;
}

export async function scrapeSmartRecruiters(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  const errors: string[] = [];

  const BATCH = 5;
  for (let i = 0; i < SMARTRECRUITERS_COMPANIES.length; i += BATCH) {
    const batch = SMARTRECRUITERS_COMPANIES.slice(i, i + BATCH);
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
    console.warn("[smartrecruiters] partial errors:", errors.join(", "));
  }

  console.log(
    `[smartrecruiters] fetched ${results.length} recent US tech jobs from ${SMARTRECRUITERS_COMPANIES.length} companies`
  );
  return results;
}
