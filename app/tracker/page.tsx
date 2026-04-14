import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Nav from "@/components/nav";
import TrackerClient from "@/components/tracker-client";

export default async function TrackerPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [applicationsRes, viewsRes] = await Promise.all([
    supabase
      .from("applications")
      .select("id, job_id, applied_at, status, jobs(id, title, company, location, source, track, level, url, posted_at)")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false }),
    supabase
      .from("job_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("viewed_at", weekAgo),
  ]);

  // Supabase infers the joined relation as array; normalize to single object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applications = (applicationsRes.data ?? []).map((app: any) => ({
    ...app,
    jobs: Array.isArray(app.jobs) ? (app.jobs[0] ?? null) : app.jobs,
  }));
  const viewsThisWeek = viewsRes.count ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All the roles you&apos;ve marked applied.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Applied</p>
            <p className="font-serif text-4xl font-bold text-foreground">{applications.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Jobs Viewed This Week</p>
            <p className="font-serif text-4xl font-bold text-foreground">{viewsThisWeek}</p>
          </div>
        </div>

        <TrackerClient applications={applications} />
      </main>
    </div>
  );
}
