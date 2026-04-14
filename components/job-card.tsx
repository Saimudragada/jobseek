"use client";

import type { Job } from "@/lib/types";
import { trackBadge, levelBadge, sourceBadge, timeAgo } from "@/lib/job-utils";
import { Button } from "@/components/ui/button";

interface Props {
  job: Job;
  applied: boolean;
  onApply: (jobId: string) => void;
  onViewDetails: (job: Job) => void;
}

export default function JobCard({ job, applied, onApply, onViewDetails }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      {/* Top row: title */}
      <div className="min-w-0">
        <h3 className="font-serif font-semibold text-base text-foreground leading-snug truncate">
          {job.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {job.company}
          {job.location ? <> &middot; {job.location}</> : null}
        </p>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
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
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(job.posted_at)}</span>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <Button
          size="sm"
          variant={applied ? "secondary" : "default"}
          onClick={() => !applied && onApply(job.id)}
          disabled={applied}
          className="text-xs h-7"
        >
          {applied ? "Applied ✓" : "Mark Applied"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onViewDetails(job)}
          className="text-xs h-7 text-muted-foreground"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
