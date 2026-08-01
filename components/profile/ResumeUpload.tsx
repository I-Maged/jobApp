"use client";

import { useState, useTransition } from "react";
import type { ChangeEvent, DragEvent } from "react";

type Props = {
  hasResume: boolean;
  resumeUrl: string | null;
};

function inferFilenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").filter(Boolean).pop() ?? "resume.pdf";
    return last;
  } catch {
    return "resume.pdf";
  }
}

export function ResumeUpload({ hasResume, resumeUrl }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFilename, setPendingFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const initialFilename = hasResume && resumeUrl
    ? inferFilenameFromUrl(resumeUrl)
    : null;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPendingFilename(file.name);
    const formData = new FormData();
    formData.set("resume", file);
    startTransition(async () => {
      try {
        const res = await fetch("/api/resume/upload", {
          method: "POST",
          body: formData,
        });
        const json = (await res.json()) as {
          success: boolean;
          error?: string;
        };
        if (!res.ok || !json.success) {
          setError(json.error ?? "Upload failed");
        }
      } catch (err) {
        console.error("[components/profile/ResumeUpload] upload", err);
        setError("Upload failed. Please try again.");
      } finally {
        setPendingFilename(null);
      }
    });
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
    e.target.value = "";
  };

  const displayedFilename = pendingFilename ?? initialFilename;

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold leading-6 text-text-primary">Resume</h2>
      <p className="mt-1 text-sm leading-5 text-text-secondary">
        Upload your existing resume or generate a new one from your profile.
      </p>

      <label
        htmlFor="resume-upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-surface-secondary px-6 py-10 text-center transition-colors ${
          isDragging ? "border-accent bg-accent-muted" : "border-border-light hover:border-accent"
        }`}
      >
        <UploadIcon className="h-7 w-7 text-text-muted" />
        <span className="text-sm font-medium text-text-primary">
          Click to upload or drag and drop
        </span>
        <span className="text-xs text-text-muted">PDF format only, maximum file size 10MB</span>
        {displayedFilename ? (
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
            {pendingFilename ? (
              <SpinnerIcon className="h-3 w-3 animate-spin" />
            ) : null}
            {displayedFilename}
          </span>
        ) : null}
        {error ? (
          <span className="text-xs font-medium text-error" role="alert">
            {error}
          </span>
        ) : null}
        <input
          id="resume-upload"
          name="resume"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={onFileChange}
          disabled={pending}
        />
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-text-muted">
          {pending ? "Uploading…" : hasResume && resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:text-accent-dark"
            >
              View current resume
            </a>
          ) : (
            "Replace any time — same path overwrites the saved file."
          )}
        </div>
        <button
          type="button"
          disabled
          title="Generate Resume lands in Feature 08"
          className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          Generate Resume from Profile
        </button>
      </div>
    </section>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
