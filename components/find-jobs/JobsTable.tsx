"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, getScoreTier } from "@/lib/jobs-view";
import type { DisplayJob, MatchTier, SortKey } from "@/lib/jobs-view";

const SCORE_TEXT_CLASS = {
  high: "text-success",
  mid: "text-info",
  low: "text-warning",
} as const;

const SCORE_BAR_CLASS = {
  high: "bg-success",
  mid: "bg-info",
  low: "bg-warning",
} as const;

function getScoreColor(score: number): string {
  return SCORE_TEXT_CLASS[getScoreTier(score)];
}

function getScoreBarColor(score: number): string {
  return SCORE_BAR_CLASS[getScoreTier(score)];
}

type Props = {
  rows: DisplayJob[];
  hasJobs: boolean;
  filterText: string;
  onFilterTextChange: (value: string) => void;
  matchTier: MatchTier;
  onMatchTierChange: (tier: MatchTier) => void;
  sortKey: SortKey;
  onSortKeyChange: (sort: SortKey) => void;
};

export function JobsTable({
  rows,
  hasJobs,
  filterText,
  onFilterTextChange,
  matchTier,
  onMatchTierChange,
  sortKey,
  onSortKeyChange,
}: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-0 rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Filter by company or role..."
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
          className="block w-full flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex items-center gap-3">
          <select
            value={matchTier}
            onChange={(e) => onMatchTierChange(e.target.value as MatchTier)}
            className="block w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Matches</option>
            <option value="high">High Match</option>
            <option value="low">Low Match</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
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
                  {hasJobs
                    ? "No jobs match your filters."
                    : "No jobs yet. Run a search to find matching roles."}
                </td>
              </tr>
            ) : (
              rows.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => router.push(`/find-jobs/${job.id}`)}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-surface-secondary last:border-b-0"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/find-jobs/${job.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-text-primary transition-colors hover:text-accent"
                    >
                      {job.company}
                    </Link>
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
