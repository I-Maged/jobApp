import { BulletList } from "@/components/ui/BulletList";
import type { Job } from "@/types";

type Props = {
  job: Job;
};

export function JobDescription({ job }: Props) {
  const responsibilities = job.responsibilities ?? [];
  const requirements = job.requirements ?? [];
  const niceToHave = job.nice_to_have ?? [];
  const benefits = job.benefits ?? [];

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div>
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Job Description
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {job.about_role || "No description is available for this job yet."}
        </p>
      </div>

      {responsibilities.length > 0 && (
        <BulletList title="Responsibilities" items={responsibilities} />
      )}
      {requirements.length > 0 && (
        <BulletList title="Requirements" items={requirements} />
      )}
      {niceToHave.length > 0 && (
        <BulletList title="Nice to Have" items={niceToHave} />
      )}
      {benefits.length > 0 && (
        <BulletList title="Benefits" items={benefits} />
      )}

      {job.about_company && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            About the Company
          </h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {job.about_company}
          </p>
        </div>
      )}
    </section>
  );
}
