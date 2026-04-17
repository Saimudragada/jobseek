// Master scraper runner — orchestrates all active ATS scrapers, deduplicates, inserts to DB.
// Active (core): Greenhouse, Lever, Ashby, Workday, SmartRecruiters
// Deferred: iCIMS, SAP, Teamtailor — require per-company API keys or Serper credits; logged in tasks.md

import { scrapeGreenhouse } from "./greenhouse";
import { scrapeLever } from "./lever";
import { scrapeAshby } from "./ashby";
import { scrapeSmartRecruiters } from "./smartrecruiters";
import { scrapeWorkday } from "./workday";
import { type ScrapedJob } from "./utils";
import { createAdminClient } from "@/lib/supabase/admin";

const BATCH_SIZE = 500;

function deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.source}::${job.ats_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function upsertJobs(jobs: ScrapedJob[]): Promise<{ inserted: number; errors: string[] }> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  let inserted = 0;

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("jobs").upsert(batch, {
      onConflict: "source,ats_id",
      ignoreDuplicates: true,
    });
    if (error) {
      errors.push(`batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

export interface ScrapeResult {
  total: number;
  inserted: number;
  bySource: Record<string, number>;
  errors: string[];
  durationMs: number;
}

export async function runAllScrapers(): Promise<ScrapeResult> {
  const start = Date.now();
  const errors: string[] = [];

  // Delete jobs older than 24 hours before inserting fresh ones
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const staleClient = createAdminClient();
  const { error: deleteError } = await staleClient.from("jobs").delete().lt("posted_at", cutoff);
  if (deleteError) console.warn("[scraper] stale cleanup error:", deleteError.message);
  else console.log(`[scraper] deleted jobs older than ${cutoff}`);

  const [greenhouse, lever, ashby, smartrecruiters, workday] =
    await Promise.allSettled([
      scrapeGreenhouse(),
      scrapeLever(),
      scrapeAshby(),
      scrapeSmartRecruiters(),
      scrapeWorkday(),
    ]);

  const collect = (r: PromiseSettledResult<ScrapedJob[]>, name: string): ScrapedJob[] => {
    if (r.status === "fulfilled") return r.value;
    errors.push(`${name}: ${r.reason?.message ?? "unknown"}`);
    return [];
  };

  const allJobs: ScrapedJob[] = [
    ...collect(greenhouse, "greenhouse"),
    ...collect(lever, "lever"),
    ...collect(ashby, "ashby"),
    ...collect(smartrecruiters, "smartrecruiters"),
    ...collect(workday, "workday"),
  ];

  const unique = deduplicateJobs(allJobs);

  const bySource: Record<string, number> = {};
  for (const job of unique) {
    bySource[job.source] = (bySource[job.source] ?? 0) + 1;
  }

  console.log(`[scraper] ${unique.length} unique jobs across ${Object.keys(bySource).length} sources`);

  const { inserted, errors: dbErrors } = await upsertJobs(unique);
  errors.push(...dbErrors);

  return { total: unique.length, inserted, bySource, errors, durationMs: Date.now() - start };
}
