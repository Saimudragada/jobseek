import { tagTrack, tagLevel, buildTags, isRecent, type ScrapedJob } from "./utils";
import { WORKDAY_SLUGS } from "./company-seeds";

// Workday jobs via Apify actor "Workday Jobs API" (FJKQ5hqMjjwEVXdHG).
// Actor accepts: { companies: string[], keyword: string, maxItems: number }
// Returns rich job objects with date_posted, countries_derived, etc.

const APIFY_ACTOR_ID = "FJKQ5hqMjjwEVXdHG";
const APIFY_BASE = "https://api.apify.com/v2";

interface ApifyWorkdayItem {
  id: string;
  title: string;
  organization: string;
  organization_url: string;
  url: string;
  description_text: string;
  date_posted: string;        // ISO datetime e.g. "2026-04-14T00:00:00"
  locations_raw: { address?: { addressLocality?: string; addressCountry?: string } }[];
  countries_derived: string[];
  remote_derived: boolean;
  salary_raw: string | null;
  employment_type: string;
}

function buildLocation(item: ApifyWorkdayItem): string {
  if (item.remote_derived) return "Remote";
  const first = item.locations_raw?.[0]?.address;
  if (!first) return "";
  return [first.addressLocality, "US"].filter(Boolean).join(", ");
}

export async function scrapeWorkday(): Promise<ScrapedJob[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.warn("[workday] APIFY_API_TOKEN not set — skipping");
    return [];
  }

  let rawItems: ApifyWorkdayItem[] = [];
  try {
    const res = await fetch(
      `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${token}&timeout=180&memory=1024`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies: WORKDAY_SLUGS,
          keyword: "engineer",
          maxItems: 500,
        }),
        signal: AbortSignal.timeout(200_000),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[workday] Apify error HTTP ${res.status}: ${body.slice(0, 200)}`);
      return [];
    }

    rawItems = (await res.json()) as ApifyWorkdayItem[];
    if (!Array.isArray(rawItems)) return [];
  } catch (err: unknown) {
    console.warn("[workday] Apify fetch error:", err instanceof Error ? err.message : "unknown");
    return [];
  }

  const jobs: ScrapedJob[] = [];

  for (const item of rawItems) {
    // 48-hour recency filter
    if (!isRecent(item.date_posted)) continue;

    // US filter via countries_derived
    const isUS =
      item.remote_derived ||
      (item.countries_derived ?? []).some(
        (c) => c === "United States" || c === "United States of America"
      );
    if (!isUS) continue;

    const title = item.title ?? "";
    const description = item.description_text ?? "";
    const track = tagTrack(title, description);
    if (!track) continue;

    const level = tagLevel(title, description);
    const location = buildLocation(item);

    jobs.push({
      source: "workday",
      ats_id: item.id ?? item.url,
      title,
      company: item.organization ?? "",
      location,
      description,
      salary: item.salary_raw ?? null,
      tags: buildTags(title, track, level),
      track,
      level,
      url: item.url ?? "",
      posted_at: item.date_posted ? new Date(item.date_posted).toISOString() : null,
    });
  }

  console.log(`[workday] fetched ${jobs.length} recent US tech jobs via Apify`);
  return jobs;
}
