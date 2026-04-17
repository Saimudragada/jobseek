// Shared utilities: tagging, US filtering, deduplication
import he from "he";

export type Track = "software" | "data" | "aiml";
export type Level = "junior" | "mid" | "senior";

export interface ScrapedJob {
  source: string;
  ats_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  tags: string[];
  track: Track | null;
  level: Level | null;
  url: string;
  posted_at: string | null;
}

// ─── HTML STRIPPING ───────────────────────────────────────────────────────────

/**
 * Strips HTML tags and decodes entities from ATS job descriptions.
 * Converts block-level tags (<p>, <li>, <br>) to newlines so structure is preserved.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|section|article)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
  text = he.decode(text);
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n[ \t]+/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

// ─── TRACK TAGGING ────────────────────────────────────────────────────────────

const TRACK_KEYWORDS: Record<Track, string[]> = {
  software: [
    "software engineer", "software developer", "backend engineer",
    "frontend engineer", "fullstack engineer", "full stack engineer",
    "full-stack engineer", "mobile engineer", "ios engineer", "android engineer",
    "devops engineer", "site reliability", "sre", "platform engineer",
    "infrastructure engineer", "web developer", "web engineer",
  ],
  data: [
    "data engineer", "data pipeline", "etl engineer", "spark engineer",
    "airflow engineer", "dbt engineer", "analytics engineer",
    "data platform engineer", "data infrastructure",
  ],
  aiml: [
    "machine learning engineer", "ml engineer", "ai engineer",
    "llm engineer", "deep learning engineer", "nlp engineer",
    "computer vision engineer", "mlops engineer", "applied scientist",
    "research engineer", "ai/ml", "ai ml", "artificial intelligence engineer",
  ],
};

// Keywords that explicitly exclude a job from data/aiml tracks
const DATA_EXCLUSIONS = ["data analyst", "data scientist", "business analyst", "research scientist"];

export function tagTrack(title: string, description: string = ""): Track | null {
  const titleLower = title.toLowerCase();
  const fullText = `${title} ${description}`.toLowerCase();

  // Reject non-engineering titles regardless of description content
  for (const ex of DATA_EXCLUSIONS) {
    if (titleLower.includes(ex)) return null;
  }

  // Primary: title-only match (high confidence)
  if (TRACK_KEYWORDS.aiml.some((kw) => titleLower.includes(kw))) return "aiml";
  if (TRACK_KEYWORDS.data.some((kw) => titleLower.includes(kw))) return "data";
  if (TRACK_KEYWORDS.software.some((kw) => titleLower.includes(kw))) return "software";

  // Secondary: description match ONLY if title signals an engineering role
  const titleIsEng =
    titleLower.includes("engineer") ||
    titleLower.includes("developer") ||
    titleLower.includes("scientist") ||
    titleLower.includes("architect");

  if (titleIsEng) {
    if (TRACK_KEYWORDS.aiml.some((kw) => fullText.includes(kw))) return "aiml";
    if (TRACK_KEYWORDS.data.some((kw) => fullText.includes(kw))) return "data";
    if (TRACK_KEYWORDS.software.some((kw) => fullText.includes(kw))) return "software";
  }

  return null;
}

// ─── LEVEL TAGGING ────────────────────────────────────────────────────────────

const LEVEL_EXCLUDE = ["director", "vp ", "vice president", "c-suite", "cto", "cio", "chief"];

const LEVEL_KEYWORDS: Record<Level, string[]> = {
  junior: [
    "junior", "entry level", "entry-level", "new grad", "new graduate",
    "associate engineer", "0-2 years", "early career",
  ],
  mid: [
    "mid-level", "mid level", "intermediate", "2-5 years", "ii engineer",
    "engineer ii", "l3", "l4",
  ],
  senior: [
    "senior", "staff engineer", "principal engineer", "lead engineer",
    "tech lead", "l5", "l6", "5+ years", "sr.", "sr ",
  ],
};

export function tagLevel(title: string, description: string = ""): Level | null {
  const titleLower = title.toLowerCase();
  const text = `${title} ${description}`.toLowerCase();

  // Exclude director/VP/C-suite
  for (const ex of LEVEL_EXCLUDE) {
    if (titleLower.includes(ex)) return null;
  }

  if (LEVEL_KEYWORDS.senior.some((kw) => text.includes(kw))) return "senior";
  if (LEVEL_KEYWORDS.mid.some((kw) => text.includes(kw))) return "mid";
  if (LEVEL_KEYWORDS.junior.some((kw) => text.includes(kw))) return "junior";

  // Default ungrouped engineers to "mid"
  return "mid";
}

// ─── US FILTER ────────────────────────────────────────────────────────────────

const US_SIGNALS = [
  "united states", "usa", "u.s.a", "u.s.", " us ", "(us)", "remote, us",
  "remote - us", "remote (us)", "new york", "san francisco", "seattle",
  "austin", "boston", "chicago", "los angeles", "denver", "atlanta",
  "washington dc", "washington, dc", "portland", "miami", "dallas",
  "philadelphia", "new jersey", "california", "texas", "new york, ny",
  "remote", // accept unqualified "remote" — filter out non-US later by exclusions
];

const INTL_EXCLUSIONS = [
  "india", "london", "united kingdom", "uk", "canada", "toronto",
  "australia", "germany", "france", "singapore", "japan", "brazil",
  "mexico", "amsterdam", "berlin", "paris", "dublin", "toronto",
  "ontario", "british columbia", "europe", "apac", "latam", "emea",
  "worldwide", "global",
];

export function isUSLocation(location: string): boolean {
  if (!location) return false;
  const loc = location.toLowerCase().trim();

  // Reject explicit non-US
  if (INTL_EXCLUSIONS.some((ex) => loc.includes(ex))) return false;

  // Accept known US signals
  if (US_SIGNALS.some((sig) => loc.includes(sig))) return true;

  // Fallback: if short and no country signal, probably US remote
  if (loc === "remote" || loc === "anywhere") return true;

  return false;
}

// ─── TAGS BUILDER ─────────────────────────────────────────────────────────────

export function buildTags(title: string, track: Track | null, level: Level | null): string[] {
  const tags: string[] = [];
  if (track) tags.push(track);
  if (level) tags.push(level);
  return tags;
}

// ─── RECENCY FILTER ───────────────────────────────────────────────────────────

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Returns true if postedAt (ISO string or unix ms) is within the last 24 hours. */
export function isRecent(postedAt: string | number | null | undefined): boolean {
  if (!postedAt) return false;
  const ts = typeof postedAt === "number" ? postedAt : Date.parse(String(postedAt));
  if (isNaN(ts)) return false;
  return Date.now() - ts <= TWENTY_FOUR_HOURS_MS;
}

/**
 * Parses relative date strings ("3 days ago", "Just posted", "Posted Today")
 * into a unix timestamp. Returns null if unparseable or too old to matter.
 */
export function parseRelativeDate(str: string | null | undefined): number | null {
  if (!str) return null;
  const s = str.toLowerCase().trim();

  if (
    s === "just posted" ||
    s === "today" ||
    s === "posted today" ||
    s.includes("hour") ||
    s.includes("minute") ||
    s.includes("second")
  ) {
    return Date.now();
  }
  if (s === "yesterday" || s === "1 day ago" || s === "posted yesterday") {
    return Date.now() - 24 * 60 * 60 * 1000;
  }
  const daysMatch = s.match(/(\d+)\s*day/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }
  const weekMatch = s.match(/(\d+)\s*week/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1]);
    return Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
  }
  // "30+ days ago" or similar — too old
  return null;
}
