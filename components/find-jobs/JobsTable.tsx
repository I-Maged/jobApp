"use client";

import { useMemo, useState } from "react";
import type { Job } from "@/types";
import { MATCH_THRESHOLD } from "@/lib/utils";

type MockJob = {
  company: string;
  role: string;
  matchScore: number;
  salary: string;
  source: "LinkedIn" | "URL";
  dateFound: string;
};

const MOCK_JOBS: MockJob[] = [
  { company: "Vercel", role: "Senior Frontend Engineer", matchScore: 94, salary: "$160k - $200k", source: "LinkedIn", dateFound: "2026-08-01" },
  { company: "Stripe", role: "Full Stack Engineer", matchScore: 88, salary: "$180k - $240k", source: "URL", dateFound: "2026-08-01" },
  { company: "Linear", role: "Product Engineer", matchScore: 96, salary: "$150k - $190k", source: "LinkedIn", dateFound: "2026-07-31" },
  { company: "Notion", role: "Frontend Engineer", matchScore: 72, salary: "$130k - $170k", source: "LinkedIn", dateFound: "2026-07-30" },
  { company: "OpenAI", role: "Full Stack Engineer", matchScore: 91, salary: "$200k - $280k", source: "LinkedIn", dateFound: "2026-07-29" },
  { company: "Figma", role: "Design Engineer", matchScore: 58, salary: "$170k - $220k", source: "URL", dateFound: "2026-07-28" },
];

type DisplayJob = {
  id: string;
  company: string;
  role: string;
  matchScore: number;
  salary: string;
  source: string;
  dateFound: string;
};

function toDisplayJobs(jobs: Job[] | undefined): DisplayJob[] {
  if (!jobs) {
    return MOCK_JOBS.map((m) => ({
      id: `mock-${m.company}-${m.role}`,
      ...m,
    }));
  }
  return jobs.map((j) => ({
    id: j.id,
    company: j.company,
    role: j.title,
    matchScore: j.match_score,
    salary: j.salary ?? "N/A",
    source: j.source === "search" ? "Adzuna" : j.source_url || "URL",
    dateFound: j.found_at,
  }));
}

type SortKey = "score" | "newest" | "oldest";
type MatchTier = "all" | "high" | "low";

function getScoreColor(score: number) {
  if (score >= MATCH_THRESHOLD) return "text-success";
  if (score >= 60) return "text-info";
  return "text-warning";
}

function getScoreBarColor(score: number) {
  if (score >= MATCH_THRESHOLD) return "bg-success";
  if (score >= 60) return "bg-info";
  return "bg-warning";
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

type Props = {
  jobs?: Job[];
};

export function JobsTable({ jobs }: Props) {
  const [filterText, setFilterText] = useState("");
  const [matchTier, setMatchTier] = useState<MatchTier>("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const rows = useMemo(() => {
    const all = toDisplayJobs(jobs);
    const q = filterText.trim().toLowerCase();

    let list = all.filter((job) => {
      if (
        q &&
        !job.company.toLowerCase().includes(q) &&
        !job.role.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (matchTier === "high" && job.matchScore < MATCH_THRESHOLD) return false;
      if (matchTier === "low" && job.matchScore >= MATCH_THRESHOLD) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === "score") return b.matchScore - a.matchScore;
      if (sortKey === "newest")
        return b.dateFound.localeCompare(a.dateFound);
      return a.dateFound.localeCompare(b.dateFound);
    });

    return list;
  }, [jobs, filterText, matchTier, sortKey]);

  return (
    <div className="flex flex-col gap-0 rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Filter by company or role..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="block w-full flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex items-center gap-3">
          <select
            value={matchTier}
            onChange={(e) => setMatchTier(e.target.value as MatchTier)}
            className="block w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Matches</option>
            <option value="high">High Match</option>
            <option value="low">Low Match</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="block w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="score">Match Score</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Company
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Match Score
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Salary Est.
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Source
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Date Found
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm text-text-muted"
                >
                  No jobs match your filters.
                </td>
              </tr>
            ) : (
              rows.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border transition-colors hover:bg-surface-secondary last:border-b-0"
                >
                  <td className="px-5 py-4 text-sm font-medium text-text-primary">
                    {job.company}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-primary">
                    {job.role}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold tabular-nums ${getScoreColor(job.matchScore)}`}
                      >
                        {job.matchScore}%
                      </span>
                      <div className="h-1 w-20 overflow-hidden rounded-full bg-border-light">
                        <div
                          className={`h-full rounded-full ${getScoreBarColor(job.matchScore)}`}
                          style={{ width: `${job.matchScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary tabular-nums">
                    {job.salary}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.source === "LinkedIn"
                          ? "bg-linkedin-light text-linkedin"
                          : "bg-surface-secondary text-text-secondary"
                      }`}
                    >
                      {job.source}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-text-muted">
                    {formatDate(job.dateFound)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
