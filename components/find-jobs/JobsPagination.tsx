"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function JobsPagination() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-text-secondary">
        Showing <span className="font-medium text-text-primary">1</span> to{" "}
        <span className="font-medium text-text-primary">6</span> of{" "}
        <span className="font-medium text-text-primary">24</span> results
      </p>
      <div className="flex items-center gap-0 rounded-md border border-border bg-surface">
        <button
          type="button"
          disabled
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          className="border-l border-border bg-accent-muted px-3 py-1.5 text-sm font-medium text-on-accent-tint"
        >
          1
        </button>
        <button
          type="button"
          className="border-l border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          2
        </button>
        <button
          type="button"
          className="border-l border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          3
        </button>
        <button
          type="button"
          className="flex items-center gap-1 border-l border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
