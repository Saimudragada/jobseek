"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface ExistingResume {
  id: string;
  uploaded_at: string;
  structured_json: Record<string, unknown> | null;
}

interface Props {
  existingResume: ExistingResume | null;
}

export default function ResumeUpload({ existingResume }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<ExistingResume | null>(existingResume);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setResume(json.data);
        setSuccess(true);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const parsedName =
    resume?.structured_json &&
    typeof resume.structured_json === "object" &&
    "name" in resume.structured_json
      ? (resume.structured_json.name as string)
      : null;

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
        />
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Uploading and parsing…" : "Drop your PDF here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">PDF only, max 10 MB</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
          {error}
        </p>
      )}

      {/* Success */}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-md">
          Resume uploaded and parsed successfully.
        </p>
      )}

      {/* Current resume */}
      {resume && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-serif font-semibold text-lg mb-1">
            Current Resume
          </h2>
          {parsedName && (
            <p className="text-sm text-muted-foreground mb-1">
              Parsed as: <span className="font-medium text-foreground">{parsedName}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Uploaded {new Date(resume.uploaded_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            Replace resume
          </Button>
        </div>
      )}
    </div>
  );
}
