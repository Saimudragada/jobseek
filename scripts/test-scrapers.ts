// Quick smoke test for all scrapers
// Run with: npx ts-node --project tsconfig.json scripts/test-scrapers.ts
// (or via tsx: npx tsx scripts/test-scrapers.ts)

import { scrapeGreenhouse } from "../lib/scrapers/greenhouse";
import { scrapeLever } from "../lib/scrapers/lever";
import { scrapeAshby } from "../lib/scrapers/ashby";
import { scrapeSmartRecruiters } from "../lib/scrapers/smartrecruiters";
import { scrapeTeamtailor } from "../lib/scrapers/teamtailor";

async function main() {
  console.log("=== Scraper Smoke Test ===\n");

  const scrapers = [
    { name: "Greenhouse", fn: scrapeGreenhouse },
    { name: "Lever", fn: scrapeLever },
    { name: "Ashby", fn: scrapeAshby },
    { name: "SmartRecruiters", fn: scrapeSmartRecruiters },
    { name: "Teamtailor", fn: scrapeTeamtailor },
  ];

  for (const { name, fn } of scrapers) {
    try {
      const jobs = await fn();
      console.log(`✓ ${name}: ${jobs.length} jobs`);
      if (jobs.length > 0) {
        const j = jobs[0];
        console.log(`  Sample: [${j.track}/${j.level}] "${j.title}" @ ${j.company} — ${j.location}`);
        console.log(`  posted_at: ${j.posted_at}`);
      }
    } catch (err) {
      console.error(`✗ ${name}: ${err instanceof Error ? err.message : "unknown"}`);
    }
    console.log();
  }
}

main().catch(console.error);
