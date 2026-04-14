"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Job } from "@/lib/types";
import { trackBadge, levelBadge, sourceBadge, timeAgo } from "@/lib/job-utils";

interface Props {
  job: Job;
  applied: boolean;
  onClose: () => void;
  onApply: (jobId: string) => void;
}

export default function JobModal({ job, applied, onClose, onApply }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Record view
  useEffect(() => {
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: job.id }),
    }).catch(() => {});
  }, [job.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-xl border border-border shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl font-bold text-foreground leading-snug">
                {job.title}
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                {job.company} &middot; {job.location}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
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
                {job.posted_at && (
                  <span className="text-xs text-muted-foreground self-center">
                    {timeAgo(job.posted_at)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {job.salary && (
            <p className="text-sm font-medium text-foreground mb-4">
              Salary: {job.salary}
            </p>
          )}
          {job.description ? (
            <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
              {job.description.slice(0, 4000)}
              {job.description.length > 4000 && (
                <span className="text-muted-foreground"> …(truncated)</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex-shrink-0 flex items-center gap-3 flex-wrap">
          <Button
            variant={applied ? "secondary" : "default"}
            onClick={() => !applied && onApply(job.id)}
            disabled={applied}
            className="flex-shrink-0"
          >
            {applied ? "Applied ✓" : "Mark Applied"}
          </Button>
          <a
            href={`/resume?job_id=${job.id}`}
            className="flex-shrink-0 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Rewrite Resume for This Job
          </a>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline ml-auto"
            >
              View on {job.source} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
