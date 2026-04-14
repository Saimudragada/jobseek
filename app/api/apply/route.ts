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

  const { data, error } = await supabase
    .from("applications")
    .upsert(
      {
        user_id: user.id,
        job_id,
        status: "applied",
        applied_at: new Date().toISOString(),
      },
      { onConflict: "user_id,job_id" }
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

export async function DELETE(req: NextRequest) {
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

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("user_id", user.id)
    .eq("job_id", job_id);

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { removed: true }, error: null });
}
