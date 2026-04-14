import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAILY_LIMIT = 10;

const SYSTEM_PROMPT = `You are an expert technical resume writer. Rewrite the resume to match the target job.

Follow ALL rules — no exceptions:
1. Lead every bullet with an ownership verb: led, drove, launched, owned, spearheaded, built, scaled, delivered, reduced, increased
2. Format every bullet: [Concrete Result] + [Metric] + [Context]
3. Mirror EXACT keywords from the job description — copy them verbatim
4. Focus on the last 5-7 years — compress older roles to 1-2 bullets each
5. Balance three dimensions: Technical Credibility + Business Impact + Leadership Signal
6. NEVER fabricate — only restructure what already exists in the original resume
7. Plain text only — no markdown, no asterisks, no bold, no special chars
8. Briefly explain gaps or stints under 6 months inline in parentheses

Output format (plain text only, all three sections required):

SUMMARY
[2-3 sentence professional summary tailored to this specific role, mirroring job keywords]

SKILLS
[Comma-separated list of relevant technical skills from resume that match the job, organized: Languages | Frameworks | Tools | Cloud/Infra]

EXPERIENCE
[Company] | [Title] | [Dates]
• [rewritten bullet]
• [rewritten bullet]

---

[Next role]...`;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { job_description } = body as { job_description?: string };
  if (!job_description?.trim()) {
    return NextResponse.json({ data: null, error: "job_description required" }, { status: 400 });
  }

  // Rate limit — max 10 rewrites per user per day
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("rewrite_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json(
      { data: null, error: `Daily limit reached — ${DAILY_LIMIT} rewrites per day. Try again tomorrow.` },
      { status: 429 }
    );
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("raw_text")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!resume?.raw_text) {
    return NextResponse.json(
      { data: null, error: "No resume on file — upload one first" },
      { status: 422 }
    );
  }

  const userMessage = `TARGET JOB DESCRIPTION:
${job_description.slice(0, 2500)}

ORIGINAL RESUME:
${resume.raw_text.slice(0, 6000)}

Rewrite the resume following all rules above. Output all three sections: SUMMARY, SKILLS, and EXPERIENCE.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rewritten =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Log the successful rewrite for rate limiting
    await supabase.from("rewrite_logs").insert({ user_id: user.id });

    return NextResponse.json({ data: { rewritten }, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
