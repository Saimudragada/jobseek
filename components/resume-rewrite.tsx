"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface ExistingResume {
  id: string;
  uploaded_at: string;
  raw_text: string | null;
  structured_json: Record<string, unknown> | null;
}

interface Props {
  existingResume: ExistingResume | null;
  initialJobDescription?: string;
}

export default function ResumeRewrite({ existingResume, initialJobDescription = "" }: Props) {
  const [resume, setResume] = useState<ExistingResume | null>(existingResume);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [rewritten, setRewritten] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const json = await res.json();
      if (json.error) setUploadError(json.error);
      else setResume(json.data);
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  async function handleRewrite() {
    if (!resume?.raw_text) return;
    if (!jobDescription.trim()) {
      setRewriteError("Paste a job description first.");
      return;
    }
    setRewriting(true);
    setRewriteError(null);
    setRewritten("");
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription }),
      });
      const json = await res.json();
      if (json.error) setRewriteError(json.error);
      else setRewritten(json.data.rewritten);
    } catch {
      setRewriteError("Rewrite failed. Try again.");
    } finally {
      setRewriting(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const parsedName =
    resume?.structured_json && "name" in resume.structured_json
      ? (resume.structured_json.name as string)
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
      {/* ── Left: Original resume ── */}
      <div className="flex flex-col gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <h2 className="font-serif font-semibold text-lg">Your Resume</h2>

          {resume ? (
            <>
              {parsedName && (
                <p className="text-sm text-muted-foreground">
                  Parsed as: <span className="font-medium text-foreground">{parsedName}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Uploaded{" "}
                {new Date(resume.uploaded_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Replace resume"}
              </Button>
            </>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <p className="text-sm font-medium text-foreground mb-1">
                {uploading ? "Uploading…" : "Drop PDF or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground">PDF only, max 10 MB</p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
        </div>

        {/* Raw text preview */}
        {resume?.raw_text && (
          <div className="bg-card border border-border rounded-xl p-5 flex-1 overflow-hidden">
            <h3 className="font-medium text-sm mb-3 text-muted-foreground">Original text</h3>
            <pre className="text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-80 font-sans">
              {resume.raw_text.slice(0, 3000)}
              {resume.raw_text.length > 3000 && "\n…(truncated)"}
            </pre>
          </div>
        )}
      </div>

      {/* ── Right: AI rewrite ── */}
      <div className="flex flex-col gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <h2 className="font-serif font-semibold text-lg">AI Enhanced</h2>
          <p className="text-xs text-muted-foreground">
            Paste the target job description and Jobseek will rewrite your bullets to match.
          </p>

          <textarea
            placeholder="Paste the full job description here…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />

          <Button
            onClick={handleRewrite}
            disabled={rewriting || !resume?.raw_text || !jobDescription.trim()}
          >
            {rewriting ? "Rewriting…" : "Rewrite Resume"}
          </Button>

          {!resume && (
            <p className="text-xs text-muted-foreground">
              Upload your resume first to enable rewriting.
            </p>
          )}

          {rewriteError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start justify-between gap-3">
              <p className="text-sm text-destructive">{rewriteError}</p>
              <button
                onClick={() => setRewriteError(null)}
                className="text-destructive/60 hover:text-destructive text-xs underline whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Rewritten output */}
        {rewritten && (
          <div className="bg-card border border-border rounded-xl p-5 flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">Rewritten bullets</h3>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? "Copied ✓" : "Copy"}
              </Button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-96 font-sans">
              {rewritten}
            </pre>
          </div>
        )}

        {rewriting && (
          <div className="bg-card border border-border rounded-xl p-8 flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Rewriting with Claude Sonnet…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
