import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Use internal lib directly — the index.js has a self-test that breaks in Next.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text;
}

async function parseResumeWithHaiku(rawText: string): Promise<object> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Parse this resume text into structured JSON. Return ONLY valid JSON, no markdown.

Schema:
{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "summary": string,
  "experience": [{ "company": string, "title": string, "dates": string, "bullets": string[] }],
  "education": [{ "school": string, "degree": string, "dates": string }],
  "skills": string[]
}

Resume text:
${rawText.slice(0, 8000)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from Haiku");

  try {
    return JSON.parse(content.text);
  } catch {
    // Return minimal structure if parse fails
    return { raw: content.text };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ data: null, error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ data: null, error: "Only PDF files are accepted" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ data: null, error: "File must be under 10 MB" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `${user.id}/${Date.now()}-${file.name}`;

    const adminClient = createAdminClient();
    const { error: storageError } = await adminClient.storage
      .from("resumes")
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });

    if (storageError) {
      return NextResponse.json({ data: null, error: `Storage error: ${storageError.message}` }, { status: 500 });
    }

    const { data: urlData } = adminClient.storage
      .from("resumes")
      .getPublicUrl(storagePath);

    // Extract text
    const rawText = await extractPdfText(buffer);

    // Parse to structured JSON via Haiku
    const structuredJson = await parseResumeWithHaiku(rawText);

    // Upsert resume record (one active resume per user)
    const { data: resume, error: dbError } = await adminClient
      .from("resumes")
      .upsert(
        {
          user_id: user.id,
          raw_text: rawText,
          structured_json: structuredJson,
          file_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ data: null, error: `DB error: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: resume, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: resume, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
