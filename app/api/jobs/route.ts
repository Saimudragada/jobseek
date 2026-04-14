import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const source = searchParams.get("source") ?? "";
  const track = searchParams.get("track") ?? "";
  const level = searchParams.get("level") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = createAdminClient();

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .order("posted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%`);
  }
  if (source) query = query.eq("source", source);
  if (track) query = query.eq("track", track);
  if (level) query = query.eq("level", level);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ data: null, count: 0, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, error: null });
}
