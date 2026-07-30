type JobRow = {
  company: string;
  matchScore: number;
  salary: string;
  source: "LinkedIn" | "URL";
};

const JOBS: JobRow[] = [
  { company: "Vercel", matchScore: 94, salary: "$160k - $200k", source: "LinkedIn" },
  { company: "Stripe", matchScore: 88, salary: "$180k - $240k", source: "URL" },
  { company: "Linear", matchScore: 96, salary: "$150k - $190k", source: "LinkedIn" },
  { company: "Notion", matchScore: 72, salary: "$130k - $170k", source: "LinkedIn" },
  { company: "OpenAI", matchScore: 91, salary: "$200k - $280k", source: "LinkedIn" },
  { company: "Figma", matchScore: 85, salary: "$170k - $220k", source: "URL" },
];

function getScoreColor(score: number) {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-info";
  return "text-warning";
}

function getScoreBarColor(score: number) {
  if (score >= 90) return "bg-success";
  if (score >= 70) return "bg-info";
  return "bg-warning";
}

export function JobsTablePreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_48px_-12px_rgba(16,24,40,0.12)]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-secondary">
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              Company
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
          </tr>
        </thead>
        <tbody>
          {JOBS.map((job) => (
            <tr
              key={job.company}
              className="border-b border-border last:border-b-0 transition-colors hover:bg-surface-secondary"
            >
              <td className="px-5 py-4 text-sm font-medium text-text-primary">
                {job.company}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
