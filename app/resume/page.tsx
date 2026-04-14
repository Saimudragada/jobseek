import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Nav from "@/components/nav";
import ResumeRewrite from "@/components/resume-rewrite";

interface Props {
  searchParams: { job_id?: string };
}

export default async function ResumePage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [resumeRes, jobRes] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, uploaded_at, raw_text, structured_json")
      .eq("user_id", user.id)
      .maybeSingle(),
    searchParams.job_id
      ? createAdminClient()
          .from("jobs")
          .select("title, company, description")
          .eq("id", searchParams.job_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const job = jobRes.data;
  const initialJobDescription = job?.description
    ? `${job.title} at ${job.company}\n\n${job.description}`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Resume</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload your resume — get AI-rewritten bullets tailored to any job.
          </p>
          {job && (
            <p className="text-sm text-primary mt-1">
              Pre-filled for: <span className="font-medium">{job.title} at {job.company}</span>
            </p>
          )}
        </div>
        <ResumeRewrite
          existingResume={resumeRes.data}
          initialJobDescription={initialJobDescription}
        />
      </main>
    </div>
  );
}
