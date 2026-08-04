import { Search } from "lucide-react";
import { BulletList } from "@/components/ui/BulletList";
import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";

type Props = {
  research: Record<string, unknown> | null;
  company: string;
  jobId: string;
};

type ResearchDossier = {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asDossier(v: Record<string, unknown> | null): ResearchDossier | null {
  if (!v) return null;
  return {
    companyOverview: asString(v.companyOverview),
    techStack: asStringArray(v.techStack),
    culture: asStringArray(v.culture),
    whyThisRole: asString(v.whyThisRole),
    yourEdge: asStringArray(v.yourEdge),
    gapsToAddress: asStringArray(v.gapsToAddress),
    smartQuestions: asStringArray(v.smartQuestions),
    interviewPrep: asStringArray(v.interviewPrep),
    sources: asStringArray(v.sources),
  };
}

function SourceLinks({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        Sources
      </h3>
      <ul className="mt-2 space-y-1 text-xs text-text-muted">
        {sources.map((source, index) => {
          const isUrl = /^https?:\/\//i.test(source);
          return (
            <li key={`${source}-${index}`}>
              {isUrl ? (
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-primary underline decoration-text-muted underline-offset-2 transition-colors hover:text-accent"
                >
                  {source.replace(/^https?:\/\//i, "")}
                </a>
              ) : (
                source
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CompanyResearch({ research, company, jobId }: Props) {
  const dossier = asDossier(research);

  if (!dossier) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Company Research
        </h2>
        <Search className="h-8 w-8 text-text-muted" aria-hidden="true" />
        <p className="max-w-md text-sm leading-5 text-text-secondary">
          No research yet for {company}. The agent will browse the
          company&apos;s public pages and summarize their stack, culture, and
          what to expect.
        </p>
        <ResearchCompanyButton jobId={jobId} company={company} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold leading-6 text-text-primary">
        Company Research
      </h2>

      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          Company Overview
        </h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {dossier.companyOverview || "No company overview available yet."}
          </p>
      </div>

      {dossier.techStack.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Tech Stack
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {dossier.techStack.map((tech, index) => (
              <li
                key={`${tech}-${index}`}
                className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dossier.culture.length > 0 && (
        <BulletList title="Culture" items={dossier.culture} />
      )}

      {dossier.whyThisRole && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Why This Role Exists
          </h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {dossier.whyThisRole}
          </p>
        </div>
      )}

      {dossier.yourEdge.length > 0 && (
        <BulletList title="Your Edge" items={dossier.yourEdge} />
      )}

      {dossier.gapsToAddress.length > 0 && (
        <BulletList title="Gaps to Address" items={dossier.gapsToAddress} />
      )}

      {dossier.smartQuestions.length > 0 && (
        <BulletList title="Smart Questions" items={dossier.smartQuestions} />
      )}

      {dossier.interviewPrep.length > 0 && (
        <BulletList title="Interview Prep" items={dossier.interviewPrep} />
      )}

      <SourceLinks sources={dossier.sources} />
    </section>
  );
}
