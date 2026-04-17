"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Job } from "@/lib/types";
import JobCard from "@/components/job-card";
import JobModal from "@/components/job-modal";

const SOURCES = ["greenhouse", "lever", "ashby", "smartrecruiters", "workday"];
const TRACKS = ["software", "data", "aiml"];
const LEVELS = ["junior", "mid", "senior"];

function Skeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-3 bg-muted rounded w-1/2 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-5 bg-muted rounded-full w-12" />
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
      <div className="h-7 bg-muted rounded w-24" />
    </div>
  );
}

interface Props {
  appliedJobIds: string[];
}

export default function JobFeed({ appliedJobIds: initialApplied }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [track, setTrack] = useState("");
  const [level, setLevel] = useState("");
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set(initialApplied));
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const offset = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(
    async (opts: { q: string; source: string; track: string; level: string; append?: boolean }) => {
      const { append } = opts;
      if (!append) {
        setLoading(true);
        offset.current = 0;
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        q: opts.q,
        source: opts.source,
        track: opts.track,
        level: opts.level,
        limit: "50",
        offset: String(offset.current),
      });

      try {
        const res = await fetch(`/api/jobs?${params}`);
        const json = await res.json();
        if (json.data) {
          // Safety net: only show jobs from last 24 hours
          const cutoff = Date.now() - 24 * 60 * 60 * 1000;
          const fresh = (json.data as Job[]).filter(
            (j) => j.posted_at && new Date(j.posted_at).getTime() >= cutoff
          );
          setJobs((prev) => (append ? [...prev, ...fresh] : fresh));
          setTotal(json.count ?? 0);
          offset.current += fresh.length;
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchJobs({ q: "", source: "", track: "", level: "" });
  }, [fetchJobs]);

  // Debounced re-fetch on filter change
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchJobs({ q: query, source, track, level });
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, source, track, level, fetchJobs]);

  async function handleApply(jobId: string) {
    setAppliedIds((prev) => new Set(Array.from(prev).concat(jobId)));
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId }),
    });
    if (!res.ok) {
      // Rollback on failure
      setAppliedIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }

  function pill(label: string, active: boolean, onClick: () => void) {
    return (
      <button
        key={label}
        onClick={onClick}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
          active
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:border-primary/50"
        }`}
      >
        {label === "aiml" ? "AI/ML" : label.charAt(0).toUpperCase() + label.slice(1)}
      </button>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by title or company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Source */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground font-medium mr-1">Source:</span>
          {pill("All", source === "", () => setSource(""))}
          {SOURCES.map((s) => pill(s, source === s, () => setSource(source === s ? "" : s)))}
        </div>
        <div className="w-full border-b border-border/30" />
        {/* Track */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground font-medium mr-1">Track:</span>
          {pill("All", track === "", () => setTrack(""))}
          {TRACKS.map((t) => pill(t, track === t, () => setTrack(track === t ? "" : t)))}
        </div>
        {/* Level */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground font-medium mr-1">Level:</span>
          {pill("All", level === "", () => setLevel(""))}
          {LEVELS.map((l) => pill(l, level === l, () => setLevel(level === l ? "" : l)))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted-foreground mb-4">
          {total} job{total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Job grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-lg text-foreground mb-2">
            {query || source || track || level
              ? "No jobs found"
              : "No jobs posted in the last 24 hours"}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {query || source || track || level
              ? "Try adjusting your search or filters"
              : "Check back soon — new jobs are scraped daily."}
          </p>
          <button
            onClick={() => fetchJobs({ q: query, source, track, level })}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                applied={appliedIds.has(job.id)}
                onApply={handleApply}
                onViewDetails={setSelectedJob}
              />
            ))}
          </div>

          {/* Load more */}
          {jobs.length < total && (
            <div className="mt-8 text-center">
              <button
                onClick={() => fetchJobs({ q: query, source, track, level, append: true })}
                disabled={loadingMore}
                className="px-6 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : `Load more (${total - jobs.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          applied={appliedIds.has(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
