import { tagTrack, tagLevel, isUSLocation, buildTags, parseRelativeDate, isRecent, type ScrapedJob } from "./utils";

// iCIMS jobs scraped via Serper Google Jobs API.
// Serper returns Google Jobs results; we filter by "via" field containing "iCIMS".

const SERPER_URL = "https://google.serper.dev/jobs";

const QUERIES = [
  "software engineer jobs",
  "data engineer jobs",
  "machine learning engineer jobs",
];

interface SerperJob {
  title: string;
  company_name: string;
  location: string;
  via: string;
  description: string;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
  };
  job_id: string;
  apply_options?: { title: string; link: string }[];
}

interface SerperResponse {
  jobs?: SerperJob[];
}

async function querySerper(q: string): Promise<SerperJob[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("SERPER_API_KEY not set");

  const res = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q, gl: "us", hl: "en", num: 100 }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`Serper iCIMS: HTTP ${res.status}`);

  const data = (await res.json()) as SerperResponse;
  return data.jobs ?? [];
}

function isICIMSJob(job: SerperJob): boolean {
  const via = (job.via ?? "").toLowerCase();
  return via.includes("icims");
}

export async function scrapeICIMS(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const q of QUERIES) {
    try {
      const rawJobs = await querySerper(q);

      for (const job of rawJobs) {
        if (!isICIMSJob(job)) continue;
        if (seen.has(job.job_id)) continue;
        seen.add(job.job_id);

        // Recency filter
        const ts = parseRelativeDate(job.detected_extensions?.posted_at);
        if (!isRecent(ts)) continue;

        const location = job.location ?? "";
        if (!isUSLocation(location)) continue;

        const title = job.title ?? "";
        const description = job.description ?? "";
        const track = tagTrack(title, description);
        if (!track) continue;

        const level = tagLevel(title, description);
        const applyUrl =
          job.apply_options?.find((o) => o.title.toLowerCase().includes("icims"))?.link ??
          job.apply_options?.[0]?.link ??
          "";

        results.push({
          source: "icims",
          ats_id: job.job_id,
          title,
          company: job.company_name ?? "",
          location,
          description,
          salary: null,
          tags: buildTags(title, track, level),
          track,
          level,
          url: applyUrl,
          posted_at: ts ? new Date(ts).toISOString() : null,
        });
      }
    } catch (err: unknown) {
      errors.push(`query "${q}": ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  if (errors.length > 0) {
    console.warn("[icims] partial errors:", errors.join(", "));
  }

  console.log(`[icims] fetched ${results.length} recent US tech jobs`);
  return results;
}
