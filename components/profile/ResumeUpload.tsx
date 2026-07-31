"use client";

import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

export function ResumeUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFilename(file.name);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFilename(file.name);
  };

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
        {filename ? (
          <span className="mt-1 inline-flex items-center rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
            {filename}
          </span>
        ) : null}
        <input
          id="resume-upload"
          name="resume"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={onFileChange}
        />
      </label>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-on-dark transition-colors hover:bg-overlay"
        >
          Select Resume
        </button>
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-xl bg-surface-secondary p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-text-secondary">
          Need a fresh document based on the fields below?
        </p>
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
