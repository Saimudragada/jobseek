import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers } from "@/lib/scrapers/index";

// Secret header to prevent unauthorized triggers
const SCRAPE_SECRET = process.env.SCRAPE_SECRET ?? "";

export async function POST(req: NextRequest) {
  // Guard — require secret header in production
  if (SCRAPE_SECRET) {
    const provided = req.headers.get("x-scrape-secret") ?? "";
    if (provided !== SCRAPE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runAllScrapers();

    return NextResponse.json({
      data: {
        total: result.total,
        inserted: result.inserted,
        bySource: result.bySource,
        durationMs: result.durationMs,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/scrape]", message);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
