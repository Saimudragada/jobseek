"use client";

import { useState } from "react";
import { trackBadge, levelBadge, sourceBadge, timeAgo } from "@/lib/job-utils";
import { Button } from "@/components/ui/button";

interface AppliedJob {
  id: string;
  job_id: string;
  applied_at: string;
  status: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    source: string;
    track: string | null;
    level: string | null;
    url: string | null;
    posted_at: string | null;
  } | null;
}

interface Props {
  applications: AppliedJob[];
}

export default function TrackerClient({ applications: initial }: Props) {
  const [applications, setApplications] = useState<AppliedJob[]>(initial);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  async function handleUnapply(jobId: string) {
    // Optimistic remove
    setApplications((prev) => prev.filter((a) => a.job_id !== jobId));
    setRemoving((prev) => new Set(Array.from(prev).concat(jobId)));

    const res = await fetch("/api/apply", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId }),
    });

    if (!res.ok) {
      // Rollback on failure — reload page to restore true state
      window.location.reload();
    }

    setRemoving((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-lg text-foreground mb-1">No applications yet</p>
        <p className="text-sm text-muted-foreground">
          Head to{" "}
          <a href="/browse" className="text-primary hover:underline">
            Browse
          </a>{" "}
          and mark roles applied.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((app) => {
        const job = app.jobs;
        if (!job) return null;
        return (
          <div
            key={app.id}
            className="bg-card border border-border rounded-xl p-5 flex items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif font-semibold text-base text-foreground leading-snug truncate">
                    {job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {job.company}
                    {job.location ? <> &middot; {job.location}</> : null}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  Applied {timeAgo(app.applied_at)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {job.track && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trackBadge(job.track)}`}>
                    {job.track === "aiml" ? "AI/ML" : job.track}
                  </span>
                )}
                {job.level && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelBadge(job.level)}`}>
                    {job.level}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge(job.source)}`}>
                  {job.source}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/5"
                  disabled={removing.has(job.id)}
                  onClick={() => handleUnapply(job.id)}
                >
                  {removing.has(job.id) ? "Removing…" : "Mark Unapplied"}
                </Button>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View listing →
                  </a>
                )}
                <a
                  href={`/resume?job_id=${job.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Rewrite resume →
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
