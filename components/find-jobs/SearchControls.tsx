"use client";

import { Search } from "lucide-react";

export function SearchControls() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="job-title"
            className="text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            Job Title
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id="job-title"
              type="text"
              placeholder="Frontend Engineer"
              className="block w-full rounded-md border border-border bg-surface pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="job-location"
            className="text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            Location
          </label>
          <input
            id="job-location"
            type="text"
            placeholder="Remote, New York..."
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            disabled
            title="Find Jobs lands in Feature 10"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            Find Jobs
          </button>
        </div>
      </div>

      <div className="rounded-md border border-success-lightest bg-success-lightest px-4 py-2.5 text-sm font-medium text-on-success-tint">
        Found 8 jobs and saved 4 strong matches.
      </div>
    </div>
  );
}
