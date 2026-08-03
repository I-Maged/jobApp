import type { Job } from "@/types";

type Props = {
  job: Job;
};

const cardClass =
  "rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]";

export function MatchScore({ job }: Props) {
  const matched = job.matched_skills ?? [];
  const missing = job.missing_skills ?? [];

  return (
    <>
      <section className={cardClass}>
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          AI Match Reasoning
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
          {job.match_reason || "No match reasoning is available for this job yet."}
        </p>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Required Skills vs Your Profile
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Matched Skills
            </p>
            {matched.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {matched.map((skill, index) => (
                  <li
                    key={`${skill}-${index}`}
                    className="inline-flex items-center rounded-full bg-success-lightest px-2 py-0.5 text-xs font-medium text-success-foreground"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-text-muted">
                No matched skills recorded.
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Missing Skills
            </p>
            {missing.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {missing.map((skill, index) => (
                  <li
                    key={`${skill}-${index}`}
                    className="inline-flex items-center rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-on-accent-tint"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-text-muted">
                No missing skills recorded.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
