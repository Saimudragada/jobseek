import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Nav from "@/components/nav";
import JobFeed from "@/components/job-feed";

export default async function BrowsePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Prefetch user's applied job IDs so cards render correctly on first load
  const { data: applications } = await supabase
    .from("applications")
    .select("job_id")
    .eq("user_id", user.id);

  const appliedJobIds = (applications ?? []).map((a) => a.job_id as string);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Browse Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            US tech roles posted in the last 48 hours
          </p>
        </div>
        <JobFeed appliedJobIds={appliedJobIds} />
      </main>
    </div>
  );
}
