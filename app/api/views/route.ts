import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { job_id } = body as { job_id?: string };
  if (!job_id) {
    return NextResponse.json({ data: null, error: "job_id required" }, { status: 400 });
  }

  // Upsert — updates viewed_at if already viewed, inserts if first view
  const { error } = await supabase
    .from("job_views")
    .upsert(
      { user_id: user.id, job_id, viewed_at: new Date().toISOString() },
      { onConflict: "user_id,job_id" }
    );

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { recorded: true }, error: null });
}
