"use client";

import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { captureEvent } from "@/lib/posthog-client";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { Job } from "@/types";

type Props = {
  userId: string;
  onResults: (jobs: Job[]) => void;
};

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

export function SearchControls({ userId, onResults }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [result, setResult] = useState<{
    totalFound: number;
    strongMatches: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = async () => {
    if (status === "loading" || isPending) return;

    const trimmedTitle = jobTitle.trim();
    if (!trimmedTitle) {
      setStatus("error");
      setErrorMessage("Please enter a job title.");
      return;
    }

    captureEvent("job_search_started", {
      userId,
      jobTitle: trimmedTitle,
      location: location.trim(),
    });

    setStatus("loading");
    setErrorMessage("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/find", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: trimmedTitle,
            location: location.trim(),
          }),
        });

        const json = (await res.json()) as {
          success: boolean;
          totalFound?: number;
          strongMatches?: number;
          results?: Job[];
          error?: string;
        };

        if (!res.ok || !json.success) {
          setStatus("error");
          setErrorMessage(
            json.error ?? "Something went wrong. Please try again.",
          );
          return;
        }

        const totalFound = json.totalFound ?? 0;
        const strongMatches = json.strongMatches ?? 0;
        const results = json.results ?? [];

        setResult({ totalFound, strongMatches });
        setStatus(totalFound > 0 ? "success" : "empty");
        onResults(results);
      } catch (err) {
        console.error("[SearchControls] fetch error", err);
        setStatus("error");
        setErrorMessage("Network error. Please try again.");
      }
    });
  };

  const isLoading = status === "loading" || isPending;

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
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSearch();
              }}
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSearch();
            }}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isLoading}
            title="Find Jobs"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isLoading ? "Searching..." : "Find Jobs"}
          </button>
        </div>
      </div>

      {status === "success" && result && (
        <div className="rounded-md border border-success-lightest bg-success-lightest px-4 py-2.5 text-sm font-medium text-on-success-tint">
          Found {result.totalFound} jobs and saved {result.strongMatches}{" "}
          strong matches.
        </div>
      )}

      {status === "empty" && (
        <div className="rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-text-secondary">
          No jobs found for that search. Try a different title or location.
        </div>
      )}

      {status === "error" && <ErrorBanner>{errorMessage}</ErrorBanner>}
    </div>
  );
}
