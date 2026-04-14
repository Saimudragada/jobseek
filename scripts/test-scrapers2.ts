import { scrapeWorkday } from "../lib/scrapers/workday";
import { scrapeICIMS } from "../lib/scrapers/icims";
import { scrapeSAP } from "../lib/scrapers/sap";

async function main() {
  console.log("=== Scraper Smoke Test (Workday / iCIMS / SAP) ===\n");

  const scrapers = [
    { name: "Workday", fn: scrapeWorkday },
    { name: "iCIMS", fn: scrapeICIMS },
    { name: "SAP", fn: scrapeSAP },
  ];

  for (const { name, fn } of scrapers) {
    try {
      const jobs = await fn();
      console.log(`✓ ${name}: ${jobs.length} jobs`);
      if (jobs.length > 0) {
        const j = jobs[0];
        console.log(`  Sample: [${j.track}/${j.level}] "${j.title}" @ ${j.company}`);
        console.log(`  Location: ${j.location} | posted_at: ${j.posted_at}`);
      }
    } catch (err) {
      console.error(`✗ ${name}: ${err instanceof Error ? err.message : "unknown"}`);
    }
    console.log();
  }
}

main().catch(console.error);
