import { formatDate, getScoreTier } from "@/lib/jobs-view";
import type { Job } from "@/types";

type Props = {
  job: Job;
};

const MATCH_BADGE_CLASS = {
  high: "bg-success-lightest text-on-success-tint",
  mid: "bg-info-lightest text-info-foreground",
  low: "bg-warning text-warning-foreground",
} as const;

function getScoreBadgeClass(score: number): string {
  return MATCH_BADGE_CLASS[getScoreTier(score)];
}

function formatJobType(jobType: string): string {
  switch (jobType) {
    case "permanent":
    case "fulltime":
      return "Full-time";
    case "part_time":
    case "parttime":
      return "Part-time";
    case "contract":
      return "Contract";
    case "temporary":
      return "Temporary";
    case "internship":
      return "Internship";
    default:
      return jobType || "Not listed";
  }
}

const cardClass =
  "rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]";

export function JobInfo({ job }: Props) {
  const company = job.company || "Unknown company";
  const companyInitial = company.trim().charAt(0).toUpperCase() || "?";

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-on-dark"
            style={{
              background: "linear-gradient(45deg, #7C5CFC 0%, #4A2EC5 100%)",
            }}
            aria-hidden="true"
          >
            {companyInitial}
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-7 text-text-primary">
              {job.title}
            </h1>
            <p className="mt-1 text-sm leading-5 text-text-secondary">
              {company}
              {job.location ? ` \u00b7 ${job.location}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreBadgeClass(job.match_score)}`}
          >
            {job.match_score}% Match
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              View Job Post
            </a>
            <a
              href={job.external_apply_url || job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark"
            >
              Apply Now
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Salary Est.
          </p>
          <p className="mt-1.5 text-sm font-semibold text-text-primary">
            {job.salary ?? "Not listed"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Location
          </p>
          <p className="mt-1.5 text-sm font-semibold text-text-primary">
            {job.location || "Not listed"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Job Type
          </p>
          <p className="mt-1.5 text-sm font-semibold text-text-primary">
            {formatJobType(job.job_type)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Date Found
          </p>
          <p className="mt-1.5 text-sm font-semibold text-text-primary">
            {formatDate(job.found_at)}
          </p>
        </div>
      </div>
    </section>
  );
}
