"use client";

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

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-info";
  return "text-warning";
}

function getScoreBarColor(score: number) {
  if (score >= 80) return "bg-success";
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

export function JobsTable() {
  return (
    <div className="flex flex-col gap-0 rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Filter by company or role..."
          className="block w-full flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex items-center gap-3">
          <select
            defaultValue="all"
            className="block w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Matches</option>
            <option value="high">High Match</option>
            <option value="low">Low Match</option>
          </select>
          <select
            defaultValue="score"
            className="block w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="score">Match Score</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
            {MOCK_JOBS.map((job) => (
              <tr
                key={job.company}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
